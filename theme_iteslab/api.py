"""Whitelisted endpoints and payload building for Theme ItesLab.

Every write goes through the normal permission stack: the caller must be able to
write "Theme Settings", which by default only System Manager can. Nothing here
touches an ERPNext document.
"""

import frappe
from frappe import _

from theme_iteslab.compat import PACKAGE_TARGET, frappe_major, shell
from theme_iteslab.presets import (
	COLOR_VARIABLE_MAP,
	DARK_OVERRIDE_MAP,
	DARK_SURFACES,
	DEFAULTS,
	PRESET_NAMES,
	PRESETS,
	SHADOWS,
	SIZE_VARIABLE_MAP,
	TABLE_COLOR_FIELDS,
	UNITLESS_VARIABLE_MAP,
)

CACHE_KEY = "iteslab_theme_payload"

# Fields that carry a unit when written to CSS.
PX_FIELDS = set(SIZE_VARIABLE_MAP.keys())

# Accent colours that survive the switch to dark mode.
DARK_SAFE_COLORS = (
	"primary_color",
	"secondary_color",
	"success_color",
	"warning_color",
	"error_color",
	"sidebar_active",
)


def get_settings() -> dict:
	"""Return Theme Settings as a plain dict, falling back to the defaults.

	Reads the Single doc without raising if the DocType has not been migrated
	yet, so a half-installed site still renders.
	"""
	values = DEFAULTS.copy()
	try:
		doc = frappe.get_cached_doc("Theme Settings")
	except Exception:
		return values

	for field in list(values.keys()):
		value = doc.get(field)
		if value not in (None, ""):
			values[field] = value

	values["custom_css"] = doc.get("custom_css") or ""

	# The dark overrides are deliberately allowed to stay empty: empty means
	# "derive it from the palette", which is not the same as any colour.
	for field in DARK_OVERRIDE_MAP:
		values[field] = doc.get(field) or ""

	return values


def build_payload(settings: dict | None = None) -> dict:
	"""Turn stored settings into the variable blocks the browser applies."""
	settings = settings or get_settings()

	light_vars = {}
	dark_vars = {}
	for field, variable in COLOR_VARIABLE_MAP.items():
		value = settings.get(field) or DEFAULTS.get(field)
		light_vars[variable] = value
		if field in DARK_SAFE_COLORS:
			dark_vars[variable] = value

	# Derived light tokens.
	light_vars["--iteslab-surface-alt"] = _mix(settings.get("background_color"), "#FFFFFF", 0.5)
	light_vars["--iteslab-primary-soft"] = _with_alpha(settings.get("primary_color"), 0.10)
	light_vars["--iteslab-primary-contrast"] = _readable_on(settings.get("primary_color"))

	# Dark surfaces: start from the derived set, then let the Dark Mode tab
	# override any of them. Resolved before anything is derived from them.
	dark_surfaces = DARK_SURFACES.copy()
	for field, variable in DARK_OVERRIDE_MAP.items():
		override = (settings.get(field) or "").strip()
		if override:
			dark_surfaces[variable] = override

	dark_vars.update(dark_surfaces)
	dark_vars["--iteslab-sidebar-icon"] = dark_surfaces["--iteslab-muted"]
	dark_vars["--iteslab-surface-alt"] = _mix(
		dark_surfaces["--iteslab-surface"], dark_surfaces["--iteslab-background"], 0.5
	)
	dark_vars["--iteslab-primary-soft"] = _with_alpha(settings.get("primary_color"), 0.18)
	dark_vars["--iteslab-primary-contrast"] = _readable_on(settings.get("primary_color"))

	# Table colours are not carried into dark mode — a light header on a dark
	# table is unreadable — so they are re-derived from the resolved surfaces.
	dark_vars["--iteslab-table-header-bg"] = dark_vars["--iteslab-surface-alt"]
	dark_vars["--iteslab-table-header-text"] = dark_surfaces["--iteslab-muted"]
	dark_vars["--iteslab-table-border"] = dark_surfaces["--iteslab-border"]
	dark_vars["--iteslab-table-row-hover"] = dark_vars["--iteslab-surface-alt"]
	dark_vars["--iteslab-table-stripe"] = _mix(
		dark_surfaces["--iteslab-surface"], dark_surfaces["--iteslab-border"], 0.35
	)

	shared_vars = {}
	for field, variable in SIZE_VARIABLE_MAP.items():
		value = settings.get(field) or DEFAULTS.get(field)
		shared_vars[variable] = f"{int(value)}px" if field in PX_FIELDS else str(value)

	for field, variable in UNITLESS_VARIABLE_MAP.items():
		shared_vars[variable] = str(settings.get(field) or DEFAULTS.get(field))

	shared_vars.update(SHADOWS.get(settings.get("shadow_size") or "Medium", SHADOWS["Medium"]))
	shared_vars["--iteslab-transition"] = (
		"150ms ease" if frappe.utils.cint(settings.get("enable_animations")) else "0ms linear"
	)

	return {
		"enabled": bool(frappe.utils.cint(settings.get("enable_theme"))),
		# Table behaviour that is a class on <html>, not a variable: border
		# style is three mutually exclusive rule sets, the rest are switches.
		"table_border_style": (settings.get("table_border_style") or "Horizontal").lower(),
		"table_sticky_header": bool(frappe.utils.cint(settings.get("table_sticky_header"))),
		"table_header_uppercase": bool(frappe.utils.cint(settings.get("table_header_uppercase"))),
		# The browser needs to know which Desk it is running in: the v15 shell
		# has a top navbar, the v16 shell does not. Detected server side so the
		# client never has to sniff the DOM for it.
		"shell": shell(),
		"frappe_major": frappe_major(),
		"package_target": PACKAGE_TARGET,
		"appearance": settings.get("default_appearance") or "System",
		"density": settings.get("density") or "Comfortable",
		"zebra_tables": bool(frappe.utils.cint(settings.get("zebra_tables"))),
		"collapse_sidebar_by_default": bool(
			frappe.utils.cint(settings.get("collapse_sidebar_by_default"))
		),
		"preset": settings.get("theme_preset") or "ItesLab Default",
		"vars": light_vars,
		"dark_vars": dark_vars,
		"shared_vars": shared_vars,
		"custom_css": settings.get("custom_css") or "",
	}


def get_theme_payload() -> dict:
	"""Cached payload used by boot and by the website context."""
	cached = frappe.cache().get_value(CACHE_KEY)
	if cached:
		return cached

	payload = build_payload()
	frappe.cache().set_value(CACHE_KEY, payload)
	return payload


def clear_theme_cache(doc=None, method=None):
	"""Drop the cache and push the new palette to every open session."""
	frappe.cache().delete_value(CACHE_KEY)
	frappe.clear_cache(doctype="Theme Settings")

	try:
		frappe.publish_realtime(
			"iteslab_theme_updated",
			message=build_payload(),
			after_commit=True,
		)
	except Exception:
		# Realtime is a convenience, never a requirement.
		frappe.log_error(title="Theme ItesLab: realtime publish failed")


# ---------------------------------------------------------------------------
# Whitelisted endpoints
# ---------------------------------------------------------------------------


@frappe.whitelist(allow_guest=True)
def get_theme() -> dict:
	"""Read the active theme. Guest-readable so the login page can style itself.

	Only presentation tokens are returned; no document data is exposed.
	"""
	return get_theme_payload()


@frappe.whitelist()
def get_settings_and_presets() -> dict:
	"""Everything the Theme Builder needs in one call."""
	frappe.only_for("System Manager")
	return {
		"settings": get_settings(),
		"presets": PRESET_NAMES,
		"defaults": DEFAULTS,
	}


@frappe.whitelist()
def save_theme(values: str | dict) -> dict:
	"""Persist the Theme Builder form. Permission-checked by Frappe on save."""
	values = frappe.parse_json(values) or {}

	doc = frappe.get_doc("Theme Settings")
	doc.check_permission("write")

	allowed = set(DEFAULTS.keys()) | {"custom_css"}
	for field, value in values.items():
		if field in allowed:
			doc.set(field, value)

	doc.save()
	frappe.msgprint(_("Theme saved"), alert=True, indicator="green")
	return build_payload()


@frappe.whitelist()
def apply_preset(preset: str) -> dict:
	"""Load a shipped preset into Theme Settings without saving it yet."""
	frappe.only_for("System Manager")
	if preset not in PRESETS:
		frappe.throw(_("Unknown preset: {0}").format(preset))

	return {"settings": PRESETS[preset], "payload": build_payload(PRESETS[preset])}


@frappe.whitelist()
def reset_theme() -> dict:
	"""Restore the ItesLab Default palette and save it."""
	return save_theme(PRESETS["ItesLab Default"])


@frappe.whitelist()
def preview_payload(values: str | dict) -> dict:
	"""Build a payload from unsaved values, for the live preview."""
	frappe.only_for("System Manager")
	values = frappe.parse_json(values) or {}
	settings = DEFAULTS.copy()
	settings.update({k: v for k, v in values.items() if k in settings or k == "custom_css"})
	return build_payload(settings)


# ---------------------------------------------------------------------------
# Small colour helpers (no external dependency)
# ---------------------------------------------------------------------------


def _to_rgb(value: str | None):
	value = (value or "").strip().lstrip("#")
	if len(value) == 3:
		value = "".join(char * 2 for char in value)
	if len(value) != 6:
		return None
	try:
		return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))
	except ValueError:
		return None


def _with_alpha(color: str | None, alpha: float) -> str:
	rgb = _to_rgb(color) or (29, 161, 242)
	return f"rgba({rgb[0]}, {rgb[1]}, {rgb[2]}, {alpha})"


def _mix(color_a: str | None, color_b: str | None, weight: float) -> str:
	first = _to_rgb(color_a) or (255, 255, 255)
	second = _to_rgb(color_b) or (255, 255, 255)
	mixed = [round(first[i] * (1 - weight) + second[i] * weight) for i in range(3)]
	return "#{:02X}{:02X}{:02X}".format(*mixed)


def _luminance(color: str | None) -> float:
	"""WCAG relative luminance."""
	rgb = _to_rgb(color) or (29, 161, 242)
	channels = []
	for channel in rgb:
		value = channel / 255
		channels.append(value / 12.92 if value <= 0.03928 else ((value + 0.055) / 1.055) ** 2.4)
	return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]


def _readable_on(color: str | None) -> str:
	"""Pick the foreground that actually has more contrast on this background.

	Comparing real WCAG contrast ratios rather than testing luminance against a
	threshold: mid-tone accents such as amber score badly against white, and a
	threshold picks the wrong side of them.
	"""
	background = _luminance(color)
	dark = _luminance("#111827")

	white_ratio = 1.05 / (background + 0.05)
	dark_ratio = (max(background, dark) + 0.05) / (min(background, dark) + 0.05)

	return "#FFFFFF" if white_ratio >= dark_ratio else "#111827"
