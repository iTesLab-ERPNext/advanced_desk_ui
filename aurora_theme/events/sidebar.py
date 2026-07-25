import json

import frappe
from frappe.desk.desktop import get_desktop_page, get_workspace_sidebar_items


@frappe.whitelist()
def get_sidebar_pages():
	"""
	Builds the nested (parent -> children, each with its workspace cards
	and Aurora's animated-icon code) structure the custom app shell
	renders server-side. Reuses Frappe's own workspace/desktop resolution
	(`get_workspace_sidebar_items`, `get_desktop_page`) so permissions and
	workspace visibility rules stay identical to core — this only adds
	the animated-icon lookup and parent/child grouping on top.
	"""
	sidebar_data = get_workspace_sidebar_items()
	all_pages = sidebar_data.get("pages") or []

	parent_pages = [p for p in all_pages if not p.get("parent_page")]

	for parent in parent_pages:
		parent["animated_icon"] = frappe.db.get_value(
			"Workspace", parent.get("name"), "aurora_animated_icon"
		)
		desktop_page = get_desktop_page(json.dumps(parent, default=str))
		parent["cards"] = desktop_page.get("cards")

		children = [p for p in all_pages if p.get("parent_page") == parent.get("name")]
		for child in children:
			child["animated_icon"] = frappe.db.get_value(
				"Workspace", child.get("name"), "aurora_animated_icon"
			)
		parent["children"] = children

	return parent_pages
