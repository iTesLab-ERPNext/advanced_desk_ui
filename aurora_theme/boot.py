import frappe


def boot_session(bootinfo):
	try:
		settings = frappe.get_cached_doc("Theme Settings")
	except Exception:
		return

	bootinfo.aurora_theme = {
		"primary_color": settings.primary_color,
		"secondary_color": settings.secondary_color,
		"accent_color": settings.accent_color,
		"heading_font": settings.heading_font,
		"body_font": settings.body_font,
		"sidebar_logo": settings.sidebar_logo,
		"sidebar_text": settings.sidebar_text or settings.title,
	}
