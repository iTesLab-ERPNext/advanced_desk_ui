import frappe

CACHE_KEY = "advanced_desk_ui:theme_vars"


def get_active_theme_vars(settings=None):
	"""
	Returns the flat dict of CSS custom properties derived from
	Advanced Desk Settings, e.g. {"primary": "#4f46e5", "radius-md": "12px"}.
	Cached until the settings doc is next saved (see hooks.doc_events).
	"""
	cached = frappe.cache().get_value(CACHE_KEY)
	if cached:
		return cached

	settings = settings or frappe.get_cached_doc("Advanced Desk Settings")

	css_vars = {
		"primary": settings.primary_color,
		"secondary": settings.secondary_color,
		"accent": settings.accent_color,
		"sidebar": settings.sidebar_color,
		"navbar": settings.navbar_color,
		"radius-md": f"{settings.button_radius or 12}px",
		"sidebar-width": f"{settings.sidebar_width or 268}px",
		"navbar-height": f"{settings.navbar_height or 60}px",
	}
	# Drop empty values so unset fields fall back to SCSS defaults
	css_vars = {k: v for k, v in css_vars.items() if v}

	frappe.cache().set_value(CACHE_KEY, css_vars)
	return css_vars


def get_active_theme_vars_jinja():
	"""Exposed to Jinja for the branded login page (see hooks.jinja)."""
	return get_active_theme_vars()


def update_website_context(context):
	"""hooks.update_website_context — injects admin-uploaded branding
	(favicon, login background) into every website/login page render.
	Uses whatever the admin has attached in Advanced Desk Settings; falls
	back to Frappe's own defaults when nothing has been uploaded yet."""
	settings = frappe.get_cached_doc("Advanced Desk Settings")
	if settings.favicon:
		context["favicon"] = settings.favicon
	if settings.background_image:
		context["splash_image"] = settings.background_image
	if settings.login_logo:
		context["login_image"] = settings.login_logo
