import frappe

from advanced_desk_ui.utils.theme import CACHE_KEY, get_active_theme_vars


def clear_theme_cache(doc=None, method=None):
	"""doc_events hook: fires on Advanced Desk Settings save so the next
	page load rebuilds --primary/--sidebar/etc. from the new values."""
	frappe.cache().delete_value(CACHE_KEY)


def warm_theme_cache():
	"""Daily scheduler job: rebuild the cache proactively instead of on
	the first (slower) request of the day."""
	frappe.cache().delete_value(CACHE_KEY)
	get_active_theme_vars()
