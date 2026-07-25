import frappe
from frappe import _


@frappe.whitelist()
def get_favorites():
	"""All favorites for the current user, grouped by type, in sort order."""
	rows = frappe.get_all(
		"ADU Favorite",
		filters={"user": frappe.session.user},
		fields=["name", "item_type", "item_value", "label", "icon", "sort_order"],
		order_by="sort_order asc, modified desc",
	)
	grouped = {}
	for row in rows:
		grouped.setdefault(row.item_type, []).append(row)
	return grouped


@frappe.whitelist()
def toggle_favorite(item_type, item_value, label=None, icon=None):
	"""Add if not favorited, remove if already favorited. Returns new state."""
	existing = frappe.db.exists(
		"ADU Favorite",
		{"user": frappe.session.user, "item_type": item_type, "item_value": item_value},
	)
	if existing:
		frappe.delete_doc("ADU Favorite", existing, ignore_permissions=True)
		return {"favorited": False}

	doc = frappe.get_doc(
		{
			"doctype": "ADU Favorite",
			"user": frappe.session.user,
			"item_type": item_type,
			"item_value": item_value,
			"label": label or item_value,
			"icon": icon,
		}
	)
	doc.insert(ignore_permissions=True)
	return {"favorited": True}


@frappe.whitelist()
def get_recent(limit=10):
	"""
	Recently visited pages for the sidebar. Deliberately reuses Frappe's
	built-in Route History instead of tracking our own — avoids duplicated
	tracking logic and stays consistent with what the user sees elsewhere.
	"""
	limit = frappe.utils.cint(limit) or 10
	if not frappe.db.exists("DocType", "Route History"):
		return []
	rows = frappe.get_all(
		"Route History",
		filters={"user": frappe.session.user},
		fields=["route", "creation"],
		order_by="creation desc",
		limit_page_length=limit * 3,  # over-fetch, then dedupe below
	)
	seen = set()
	recent = []
	for row in rows:
		if row.route in seen:
			continue
		seen.add(row.route)
		recent.append({"route": row.route, "label": _humanize_route(row.route)})
		if len(recent) >= limit:
			break
	return recent


def _humanize_route(route):
	parts = [p for p in (route or "").split("/") if p]
	return parts[-1].replace("-", " ").title() if parts else route


@frappe.whitelist()
def search_sidebar(query, limit=8):
	"""
	Permission-aware search across Workspaces, Reports and DocTypes for the
	sidebar's inline search box. Each source is capped independently so one
	noisy source can't crowd out the others.
	"""
	if not query:
		return {"workspaces": [], "reports": [], "doctypes": []}

	limit = frappe.utils.cint(limit) or 8
	like = f"%{query}%"

	workspaces = frappe.get_all(
		"Workspace",
		filters={"title": ["like", like], "public": 1},
		fields=["name", "title", "icon"],
		limit_page_length=limit,
	)

	reports = frappe.get_all(
		"Report",
		filters={"report_name": ["like", like], "disabled": 0},
		fields=["name", "report_name", "ref_doctype"],
		limit_page_length=limit,
	)
	reports = [r for r in reports if frappe.has_permission(r.ref_doctype, "read")]

	doctypes = frappe.get_all(
		"DocType",
		filters={"name": ["like", like], "istable": 0, "issingle": 0},
		fields=["name"],
		limit_page_length=limit,
	)
	doctypes = [d for d in doctypes if frappe.has_permission(d.name, "read")]

	return {"workspaces": workspaces, "reports": reports, "doctypes": doctypes}
