import frappe
from frappe.desk.desktop import get_workspace_sidebar_items


@frappe.whitelist()
def get_sidebar_pages():
	"""
	Returns each visible workspace (parent + children) together with its
	Aurora animated-icon code, if one is set. Reuses Frappe's own
	`get_workspace_sidebar_items` so permissions/visibility stay identical
	to core. Used purely to decorate the REAL sidebar ERPNext already
	renders with animated icons (see public/js/aurora_theme.js) — this
	does not build or render a sidebar of its own.
	"""
	sidebar_data = get_workspace_sidebar_items()
	all_pages = sidebar_data.get("pages") or []

	parent_pages = [p for p in all_pages if not p.get("parent_page")]

	for parent in parent_pages:
		parent["animated_icon"] = frappe.db.get_value(
			"Workspace", parent.get("name"), "aurora_animated_icon"
		)
		children = [p for p in all_pages if p.get("parent_page") == parent.get("name")]
		for child in children:
			child["animated_icon"] = frappe.db.get_value(
				"Workspace", child.get("name"), "aurora_animated_icon"
			)
		parent["children"] = children

	return parent_pages
