import frappe
from frappe import _

no_cache = 1


def get_context(context):
	if frappe.session.user == "Guest":
		frappe.throw(_("Please log in to access the portal."), frappe.PermissionError)

	user = frappe.session.user
	context.user_full_name = frappe.db.get_value("User", user, "full_name")

	# User -> Contact (by email) -> Customer (via Dynamic Link), the
	# standard Frappe pattern for resolving a portal user to their Customer.
	customer = None
	contact_name = frappe.db.get_value("Contact", {"email_id": user}, "name")
	if contact_name:
		customer = frappe.db.get_value(
			"Dynamic Link", {"parent": contact_name, "link_doctype": "Customer"}, "link_name"
		)

	context.customer = customer
	context.stats = {"orders": 0, "invoices": 0, "outstanding": 0.0, "issues": 0}
	context.recent_orders = []
	context.recent_invoices = []

	if customer:
		if frappe.db.exists("DocType", "Sales Order"):
			context.stats["orders"] = frappe.db.count("Sales Order", {"customer": customer})
			context.recent_orders = frappe.get_all(
				"Sales Order",
				filters={"customer": customer},
				fields=["name", "transaction_date", "grand_total", "status"],
				order_by="transaction_date desc",
				limit_page_length=5,
			)

		if frappe.db.exists("DocType", "Sales Invoice"):
			context.stats["invoices"] = frappe.db.count("Sales Invoice", {"customer": customer})
			context.recent_invoices = frappe.get_all(
				"Sales Invoice",
				filters={"customer": customer},
				fields=["name", "posting_date", "grand_total", "status", "outstanding_amount"],
				order_by="posting_date desc",
				limit_page_length=5,
			)

		if frappe.db.exists("DocType", "Customer"):
			context.stats["outstanding"] = frappe.db.get_value("Customer", customer, "outstanding_amount") or 0.0

		if frappe.db.exists("DocType", "Issue"):
			context.stats["issues"] = frappe.db.count("Issue", {"customer": customer, "status": "Open"})

	context.parents = [{"name": _("Home"), "route": "/"}]
	context.title = _("Dashboard")
	context.show_sidebar = True
