#!/usr/bin/env python3
"""Check the translation CSVs against the strings actually in the app.

Runs with plain python3 — no bench, no Frappe import — so it works in CI and on
a laptop:

    python3 theme_iteslab/tests/check_translations.py

It extracts translatable strings the way Frappe's own extractor does, then
verifies that every one has a row in every shipped CSV, that nothing is
translated that no longer exists, and that format placeholders survive
translation. Placeholder drift is the dangerous one: `{0}` lost in translation
turns a message into a crash at .format() time, or silently drops the value.
"""

import csv
import json
import glob
import os
import re
import sys

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGS = ("en", "fr", "ar")

# __("...") anywhere, plus this.t("...") — the guarded wrapper in
# iteslab-logout.js that falls back to the source string before __ is loaded.
JS_PATTERN = re.compile(r'(?:__|this\.t)\(\s*(["\'])((?:\\.|(?!\1).)*?)\1')
PY_PATTERN = re.compile(r'\b_\(\s*(["\'])((?:\\.|(?!\1).)*?)\1')
PLACEHOLDER = re.compile(r"\{\d+\}")


def extract() -> set[str]:
	"""Every translatable string in the app."""
	found = set()

	for path in glob.glob(f"{APP}/**/*.js", recursive=True):
		if f"{os.sep}tests{os.sep}" in path:
			continue
		for m in JS_PATTERN.finditer(open(path, encoding="utf-8").read()):
			found.add(m.group(2).replace('\\"', '"').replace("\\'", "'").strip())

	for path in glob.glob(f"{APP}/**/*.py", recursive=True):
		if f"{os.sep}tests{os.sep}" in path or os.path.basename(path).startswith("test_"):
			continue
		for m in PY_PATTERN.finditer(open(path, encoding="utf-8").read()):
			found.add(m.group(2).replace('\\"', '"').strip())

	for path in glob.glob(f"{APP}/**/doctype/**/*.json", recursive=True):
		doc = json.load(open(path, encoding="utf-8"))
		if doc.get("doctype") != "DocType":
			continue
		found.add(doc["name"])
		if doc.get("description"):
			found.add(doc["description"])
		for f in doc.get("fields", []):
			for key in ("label", "description"):
				if f.get(key):
					found.add(f[key].strip())
			if f.get("fieldtype") == "Select" and f.get("options"):
				found.update(o.strip() for o in f["options"].split("\n") if o.strip())

	for path in glob.glob(f"{APP}/**/page/**/*.json", recursive=True):
		doc = json.load(open(path, encoding="utf-8"))
		if doc.get("doctype") == "Page" and doc.get("title"):
			found.add(doc["title"])

	found.discard("")
	return found


def load(lang: str) -> dict[str, str]:
	"""Parse a CSV exactly as frappe.translate.get_translation_dict_from_file does."""
	path = f"{APP}/translations/{lang}.csv"
	out = {}
	with open(path, encoding="utf-8", newline="") as fh:
		for row in csv.reader(fh):
			if not row:
				continue
			if len(row) not in (2, 3):
				raise SystemExit(f"{lang}.csv: row must have 2 or 3 columns, got {len(row)}: {row!r}")
			key = row[0] + (":" + row[2] if len(row) == 3 and row[2] else "")
			out[key] = row[1].strip()
	return out


def main() -> int:
	failures = []
	strings = extract()
	print(f"{len(strings)} translatable strings in the app")

	tables = {}
	for lang in LANGS:
		table = load(lang)
		tables[lang] = table
		print(f"  {lang}.csv: {len(table)} rows")

		missing = sorted(strings - set(table))
		if missing:
			failures.append(f"{lang}.csv is missing {len(missing)} string(s): {missing[:5]}")

		orphan = sorted(set(table) - strings)
		if orphan:
			failures.append(f"{lang}.csv translates {len(orphan)} string(s) no longer used: {orphan[:5]}")

		empty = sorted(k for k, v in table.items() if not v)
		if empty:
			failures.append(f"{lang}.csv has {len(empty)} empty translation(s): {empty[:5]}")

	# All three files must describe the same key set.
	keys = {lang: set(t) for lang, t in tables.items()}
	for lang in LANGS[1:]:
		if keys[lang] != keys[LANGS[0]]:
			diff = sorted(keys[lang] ^ keys[LANGS[0]])
			failures.append(f"{lang}.csv key set differs from {LANGS[0]}.csv: {diff[:5]}")

	# A dropped {0} means a crash or a silently missing value at runtime.
	for lang, table in tables.items():
		for source, translated in table.items():
			want = sorted(PLACEHOLDER.findall(source))
			got = sorted(PLACEHOLDER.findall(translated))
			if want != got:
				failures.append(f"{lang}.csv placeholder mismatch for {source!r}: {want} -> {got}")

	if failures:
		print("\nFAILED:")
		for f in failures:
			print("  -", f)
		return 1

	print("\nALL PASS — every string is translated in every language, placeholders intact")
	return 0


if __name__ == "__main__":
	sys.exit(main())
