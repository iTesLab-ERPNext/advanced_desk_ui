import json

import frappe
from frappe import _
from frappe.utils import add_days, nowdate


@frappe.whitelist()
def get_layout():
	"""This user's saved widget layout, falling back to the admin-configured
	default (Advanced Desk Settings.default_dashboard_layout), falling back
	to a sane built-in default."""
	existing = frappe.db.get_value("ADU Dashboard Layout", {"user": frappe.session.user}, "layout")
	if existing:
		return json.loads(existing)

	settings_default = frappe.db.get_single_value(
		"Advanced Desk Settings", "default_dashboard_layout"
	)
	if settings_default:
		return json.loads(settings_default)

	return DEFAULT_LAYOUT


@frappe.whitelist()
def save_layout(layout):
	if isinstance(layout, str):
		json.loads(layout)  # validate
	else:
		layout = json.dumps(layout)

	name = frappe.db.get_value("ADU Dashboard Layout", {"user": frappe.session.user})
	if name:
		doc = frappe.get_doc("ADU Dashboard Layout", name)
		doc.layout = layout
	else:
		doc = frappe.get_doc(
			{"doctype": "ADU Dashboard Layout", "user": frappe.session.user, "layout": layout}
		)
	doc.save(ignore_permissions=True)
	return {"saved": True}


@frappe.whitelist()
def get_widget_data(widget):
	"""
	Single dispatch endpoint for widget content so the client only needs one
	call signature (`get_widget_data?widget=kpis`) regardless of how many
	widget types exist.
	"""
	handler = WIDGET_HANDLERS.get(widget)
	if not handler:
		frappe.throw(_("Unknown widget: {0}").format(widget))
	return handler()


def _kpis():
	# Lightweight, permission-safe counts. Extend per-installation as needed.
	data = []
	if frappe.has_permission("ToDo", "read"):
		data.append(
			{
				"label": _("Open ToDos"),
				"value": frappe.db.count("ToDo", {"allocated_to": frappe.session.user, "status": "Open"}),
			}
		)
	if frappe.has_permission("Notification Log", "read"):
		data.append(
			{
				"label": _("Unread Notifications"),
				"value": frappe.db.count(
					"Notification Log", {"for_user": frappe.session.user, "read": 0}
				),
			}
		)
	return data


def _recent_documents():
	if not frappe.db.exists("DocType", "Route History"):
		return []
	rows = frappe.get_all(
		"Route History",
		filters={"user": frappe.session.user},
		fields=["route", "creation"],
		order_by="creation desc",
		limit_page_length=8,
	)
	return rows


def _pending_approvals():
	if not frappe.has_permission("ToDo", "read"):
		return []
	return frappe.get_all(
		"ToDo",
		filters={"allocated_to": frappe.session.user, "status": "Open"},
		fields=["name", "description", "reference_type", "reference_name", "date"],
		order_by="date asc",
		limit_page_length=10,
	)


def _tasks():
	if not frappe.db.exists("DocType", "Task") or not frappe.has_permission("Task", "read"):
		return []
	return frappe.get_all(
		"Task",
		filters={"status": ["in", ["Open", "Working"]]},
		fields=["name", "subject", "status", "exp_end_date"],
		order_by="exp_end_date asc",
		limit_page_length=10,
	)


def _projects():
	if not frappe.db.exists("DocType", "Project") or not frappe.has_permission("Project", "read"):
		return []
	return frappe.get_all(
		"Project",
		filters={"status": "Open"},
		fields=["name", "project_name", "percent_complete", "status"],
		limit_page_length=10,
	)


def _calendar():
	if not frappe.db.exists("DocType", "Event"):
		return []
	return frappe.get_all(
		"Event",
		filters={
			"starts_on": ["between", [nowdate(), add_days(nowdate(), 7)]],
		},
		fields=["name", "subject", "starts_on", "ends_on"],
		order_by="starts_on asc",
		limit_page_length=10,
	)


def _announcements():
	if not frappe.db.exists("DocType", "Notification Log"):
		return []
	return frappe.get_all(
		"Notification Log",
		filters={"for_user": frappe.session.user},
		fields=["subject", "creation", "type"],
		order_by="creation desc",
		limit_page_length=10,
	)


def _favorites_and_shortcuts():
	return frappe.get_all(
		"ADU Favorite",
		filters={"user": frappe.session.user},
		fields=["item_type", "item_value", "label", "icon"],
		order_by="sort_order asc",
		limit_page_length=20,
	)


DEFAULT_LAYOUT = [
	{"widget": "kpis", "x": 0, "y": 0, "w": 12, "h": 2},
	{"widget": "recent_documents", "x": 0, "y": 2, "w": 6, "h": 4},
	{"widget": "pending_approvals", "x": 6, "y": 2, "w": 6, "h": 4},
	{"widget": "tasks", "x": 0, "y": 6, "w": 4, "h": 4},
	{"widget": "projects", "x": 4, "y": 6, "w": 4, "h": 4},
	{"widget": "calendar", "x": 8, "y": 6, "w": 4, "h": 4},
]

WIDGET_HANDLERS = {
	"kpis": _kpis,
	"recent_documents": _recent_documents,
	"pending_approvals": _pending_approvals,
	"tasks": _tasks,
	"projects": _projects,
	"calendar": _calendar,
	"announcements": _announcements,
	"favorites_and_shortcuts": _favorites_and_shortcuts,
}
