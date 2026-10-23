"""Installation lifecycle hooks."""

import frappe

from theme_iteslab.api import clear_theme_cache
from theme_iteslab.compat import PACKAGE_TARGET, frappe_major, is_supported, shell
from theme_iteslab.presets import DEFAULTS


def check_version():
	"""Tell the operator which shell was detected, and flag a mismatch.

	A mismatch is not fatal: the shell is picked at runtime, so the theme still
	applies. It usually means the other package would be the better download.
	"""
	major = frappe_major()

	if not is_supported():
		frappe.msgprint(
			# Kept on one line: a string split across lines is invisible to the
			# translation extractor, which only ever sees the first fragment.
			frappe._("Theme ItesLab supports Frappe v15 and v16. This site reports v{0}, so the theme may not match the Desk.").format(major),
			indicator="orange",
			title=frappe._("Unsupported Frappe version"),
		)
		return

	if major != PACKAGE_TARGET:
		print(
			f"Theme ItesLab: this package targets v{PACKAGE_TARGET} but the site runs "
			f"v{major}. Using the {shell()} shell. The v{major} package is the "
			f"recommended download for this bench."
		)
	else:
		print(f"Theme ItesLab: Frappe v{major} detected, using the {shell()} shell.")


def ensure_theme_settings():
	"""Create the Single doc with the default preset if it is still empty."""
	if not frappe.db.exists("DocType", "Theme Settings"):
		return

	doc = frappe.get_single("Theme Settings")
	changed = False
	for field, value in DEFAULTS.items():
		if doc.get(field) in (None, ""):
			doc.set(field, value)
			changed = True

	if changed:
		doc.flags.ignore_permissions = True
		doc.save()
		frappe.db.commit()


def after_install():
	check_version()
	ensure_theme_settings()
	clear_theme_cache()


def after_migrate():
	check_version()
	ensure_theme_settings()
	clear_theme_cache()


def after_app_install(app_name=None):
	"""Another app was installed; drop the cached payload so assets re-resolve."""
	clear_theme_cache()
