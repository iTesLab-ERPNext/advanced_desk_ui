"""Installation lifecycle hooks."""

import frappe

from theme_myrmex.api import clear_theme_cache
from theme_myrmex.presets import DEFAULTS


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
	ensure_theme_settings()
	clear_theme_cache()


def after_migrate():
	ensure_theme_settings()
	clear_theme_cache()


def after_app_install(app_name=None):
	"""Another app was installed; drop the cached payload so assets re-resolve."""
	clear_theme_cache()
