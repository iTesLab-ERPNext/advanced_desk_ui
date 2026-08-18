# custom_erp_ui/api/dashboard.py
"""
Server-side data endpoints for the custom ERP dashboard.

These are thin, defensive wrappers around frappe.db calls: if a given
doctype (e.g. from ERPNext) isn't installed in this site, the KPI
just reports 0 instead of throwing, so the dashboard degrades
gracefully on a bare Frappe install.
"""

import frappe
from frappe import _
from frappe.utils import add_months, flt, getdate, nowdate


def _doctype_exists(doctype: str) -> bool:
	return frappe.db.table_exists(doctype)


def _safe_count(doctype: str, filters=None) -> int:
	if not _doctype_exists(doctype):
		return 0
	try:
		return frappe.db.count(doctype, filters=filters or {})
	except Exception:
		frappe.log_error(f"Dashboard KPI count failed for {doctype}", "custom_erp_ui")
		return 0


def _safe_sum(doctype: str, fieldname: str, filters=None) -> float:
	if not _doctype_exists(doctype):
		return 0.0
	try:
		result = frappe.db.get_all(
			doctype, filters=filters or {}, fields=[f"sum({fieldname}) as total"]
		)
		return flt(result[0].total) if result and result[0].total else 0.0
	except Exception:
		frappe.log_error(f"Dashboard KPI sum failed for {doctype}", "custom_erp_ui")
		return 0.0


def _pct_change(current: float, previous: float) -> float:
	if not previous:
		return 100.0 if current else 0.0
	return round(((current - previous) / previous) * 100, 1)


@frappe.whitelist()
def get_kpis():
	"""Returns the 5 KPI cards: Customers, Sales Orders, Invoices, Payments, Stock Value."""
	today = getdate(nowdate())
	this_month_start = today.replace(day=1)
	prev_month_start = getdate(add_months(this_month_start, -1))

	kpis = []

	# Customers
	total_customers = _safe_count("Customer")
	new_this_month = _safe_count("Customer", {"creation": [">=", this_month_start]})
	new_last_month = _safe_count(
		"Customer", {"creation": ["between", [prev_month_start, this_month_start]]}
	)
	kpis.append(
		{
			"key": "customers",
			"label": _("Customers"),
			"icon": "account-group",
			"value": total_customers,
			"trend": _pct_change(new_this_month, new_last_month),
			"accent": "blue",
		}
	)

	# Sales Orders
	so_this_month = _safe_count("Sales Order", {"transaction_date": [">=", this_month_start]})
	so_last_month = _safe_count(
		"Sales Order", {"transaction_date": ["between", [prev_month_start, this_month_start]]}
	)
	kpis.append(
		{
			"key": "sales_orders",
			"label": _("Sales Orders"),
			"icon": "clipboard-text",
			"value": _safe_count("Sales Order"),
			"trend": _pct_change(so_this_month, so_last_month),
			"accent": "blue",
		}
	)

	# Invoices
	inv_this_month = _safe_count("Sales Invoice", {"posting_date": [">=", this_month_start]})
	inv_last_month = _safe_count(
		"Sales Invoice", {"posting_date": ["between", [prev_month_start, this_month_start]]}
	)
	kpis.append(
		{
			"key": "invoices",
			"label": _("Invoices"),
			"icon": "file-document",
			"value": _safe_count("Sales Invoice"),
			"trend": _pct_change(inv_this_month, inv_last_month),
			"accent": "blue",
		}
	)

	# Payments (this month vs last month, by amount)
	pay_this_month = _safe_sum(
		"Payment Entry", "paid_amount", {"posting_date": [">=", this_month_start]}
	)
	pay_last_month = _safe_sum(
		"Payment Entry",
		"paid_amount",
		{"posting_date": ["between", [prev_month_start, this_month_start]]},
	)
	kpis.append(
		{
			"key": "payments",
			"label": _("Payments"),
			"icon": "cash",
			"value": pay_this_month,
			"is_currency": True,
			"trend": _pct_change(pay_this_month, pay_last_month),
			"accent": "orange",
		}
	)

	# Stock Value (from Bin, if Stock module present)
	stock_value = 0.0
	if _doctype_exists("Bin"):
		try:
			result = frappe.db.sql(
				"select sum(stock_value) as total from `tabBin`", as_dict=True
			)
			stock_value = flt(result[0].total) if result and result[0].total else 0.0
		except Exception:
			frappe.log_error("Dashboard stock value calc failed", "custom_erp_ui")
	kpis.append(
		{
			"key": "stock_value",
			"label": _("Stock Value"),
			"icon": "warehouse",
			"value": stock_value,
			"is_currency": True,
			"trend": 0.0,
			"accent": "orange",
		}
	)

	return kpis


@frappe.whitelist()
def get_recent_activity(limit: int = 8):
	"""Merges recent docs from a few doctypes into one activity feed."""
	limit = int(limit)
	activity = []

	sources = [
		("Sales Order", "name", "created"),
		("Sales Invoice", "name", "created"),
		("Payment Entry", "name", "created"),
		("Customer", "name", "created"),
	]

	for doctype, _field, _kind in sources:
		if not _doctype_exists(doctype):
			continue
		try:
			rows = frappe.db.get_all(
				doctype,
				fields=["name", "creation", "modified", "docstatus"],
				order_by="creation desc",
				limit_page_length=limit,
			)
			for row in rows:
				activity.append(
					{
						"doctype": doctype,
						"name": row.name,
						"timestamp": row.creation,
						"status": "Submitted"
						if row.docstatus == 1
						else ("Cancelled" if row.docstatus == 2 else "Draft"),
					}
				)
		except Exception:
			frappe.log_error(f"Dashboard activity fetch failed for {doctype}", "custom_erp_ui")

	activity.sort(key=lambda a: a["timestamp"], reverse=True)
	return activity[:limit]


@frappe.whitelist()
def get_sales_chart(months: int = 6):
	"""Monthly sales totals for the last N months, for the Sales Overview chart."""
	months = int(months)
	labels, values = [], []

	if not _doctype_exists("Sales Invoice"):
		return {"labels": [], "values": []}

	today = getdate(nowdate())
	for i in range(months - 1, -1, -1):
		month_start = getdate(add_months(today.replace(day=1), -i))
		month_end = getdate(add_months(month_start, 1))
		total = _safe_sum(
			"Sales Invoice", "grand_total", {"posting_date": ["between", [month_start, month_end]]}
		)
		labels.append(month_start.strftime("%b"))
		values.append(round(total, 2))

	return {"labels": labels, "values": values}


@frappe.whitelist()
def get_order_status_breakdown():
	"""Counts of Sales Orders by status, for the donut chart."""
	if not _doctype_exists("Sales Order"):
		return {"labels": [], "values": []}

	try:
		rows = frappe.db.get_all(
			"Sales Order", fields=["status", "count(name) as count"], group_by="status"
		)
		return {
			"labels": [r.status for r in rows],
			"values": [r.count for r in rows],
		}
	except Exception:
		frappe.log_error("Dashboard order status fetch failed", "custom_erp_ui")
		return {"labels": [], "values": []}
