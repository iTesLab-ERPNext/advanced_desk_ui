import frappe
from frappe import _

VALID_MODES = {"Light", "Dark", "Auto"}
VALID_DENSITIES = {"comfortable", "compact"}


@frappe.whitelist()
def set_theme_mode(mode):
	if mode not in VALID_MODES:
		frappe.throw(_("Invalid theme mode: {0}").format(mode))
	frappe.db.set_value("User", frappe.session.user, "adu_theme_mode", mode)
	frappe.db.commit()
	return {"mode": mode}


@frappe.whitelist()
def set_density(density):
	if density not in VALID_DENSITIES:
		frappe.throw(_("Invalid density: {0}").format(density))
	frappe.db.set_value("User", frappe.session.user, "adu_density", density)
	frappe.db.commit()
	return {"density": density}


@frappe.whitelist()
def get_preferences():
	user = frappe.session.user
	values = frappe.db.get_value(
		"User",
		user,
		["adu_theme_mode", "adu_density", "adu_sidebar_width", "adu_animations_enabled", "language"],
		as_dict=True,
	) or {}
	return {
		"theme_mode": values.get("adu_theme_mode") or "Light",
		"density": values.get("adu_density") or "comfortable",
		"sidebar_width": values.get("adu_sidebar_width") or 268,
		"animations_enabled": bool(values.get("adu_animations_enabled") if values.get("adu_animations_enabled") is not None else 1),
		"language": values.get("language") or "en",
	}


@frappe.whitelist()
def save_preferences(theme_mode=None, density=None, sidebar_width=None, animations_enabled=None, language=None):
	"""Single call used by the Preferences dialog so the client doesn't need
	one round-trip per field."""
	updates = {}
	if theme_mode:
		if theme_mode not in VALID_MODES:
			frappe.throw(_("Invalid theme mode: {0}").format(theme_mode))
		updates["adu_theme_mode"] = theme_mode
	if density:
		if density not in VALID_DENSITIES:
			frappe.throw(_("Invalid density: {0}").format(density))
		updates["adu_density"] = density
	if sidebar_width is not None:
		updates["adu_sidebar_width"] = frappe.utils.cint(sidebar_width)
	if animations_enabled is not None:
		updates["adu_animations_enabled"] = frappe.utils.cint(animations_enabled)
	if language:
		updates["language"] = language

	for field, value in updates.items():
		frappe.db.set_value("User", frappe.session.user, field, value)
	frappe.db.commit()
	return get_preferences()
