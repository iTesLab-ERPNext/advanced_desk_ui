import frappe

from advanced_desk_ui.utils.theme import get_active_theme_vars


def boot_session(bootinfo):
	"""
	Runs on every Desk session boot (frappe hook: extend_bootinfo).
	Pushes the admin-configured design tokens + this user's saved
	preferences into frappe.boot.advanced_desk_ui so theme_engine.js
	can apply everything before first paint (no flash of wrong theme).
	"""
	settings = frappe.get_cached_doc("Advanced Desk Settings")

	user_theme = frappe.db.get_value(
		"User", frappe.session.user, "adu_theme_mode"
	) or settings.default_theme

	bootinfo.advanced_desk_ui = {
		"css_vars": get_active_theme_vars(settings),
		"default_theme": settings.default_theme,
		"user_theme": user_theme,
		"density": frappe.db.get_value("User", frappe.session.user, "adu_density") or "comfortable",
		"animations_enabled": bool(settings.enable_animations),
		"glass_enabled": bool(settings.enable_glass_effect),
		"sidebar_width": settings.sidebar_width,
		"navbar_height": settings.navbar_height,
		"branding": {
			"company_logo": settings.company_logo,
			"login_logo": settings.login_logo,
			"favicon": settings.favicon,
			"background_image": settings.background_image,
		},
	}
