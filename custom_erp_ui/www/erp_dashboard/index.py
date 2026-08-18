import frappe

no_cache = 1


def get_context(context):
	if frappe.session.user == "Guest":
		frappe.throw(
			frappe._("You need to be logged in to view this page"),
			frappe.PermissionError,
		)

	user = frappe.get_doc("User", frappe.session.user)

	context.no_cache = 1
	context.title = "Dashboard"
	context.user_full_name = user.full_name or frappe.session.user
	context.user_image = user.user_image or ""
	context.user_role = ", ".join(frappe.get_roles(frappe.session.user)[:1]) or "User"

	# Build the sidebar nav server-side, filtered by whether the user
	# actually has read access to the target doctype/report. This keeps
	# the frontend from showing links the user can't open.
	nav_sections = [
		{
			"label": "Main",
			"items": [
				{"label": "Dashboard", "icon": "dashboard", "route": "/app/erp_dashboard", "doctype": None},
				{"label": "Customers", "icon": "account-group", "route": "/app/customer", "doctype": "Customer"},
				{"label": "Suppliers", "icon": "truck", "route": "/app/supplier", "doctype": "Supplier"},
			],
		},
		{
			"label": "Sales",
			"items": [
				{"label": "Sales Orders", "icon": "clipboard-list", "route": "/app/sales-order", "doctype": "Sales Order"},
				{"label": "Invoices", "icon": "file-document", "route": "/app/sales-invoice", "doctype": "Sales Invoice"},
				{"label": "Payments", "icon": "cash", "route": "/app/payment-entry", "doctype": "Payment Entry"},
			],
		},
		{
			"label": "Inventory",
			"items": [
				{"label": "Items", "icon": "package-variant", "route": "/app/item", "doctype": "Item"},
				{"label": "Stock", "icon": "warehouse", "route": "/app/stock-entry", "doctype": "Stock Entry"},
				{"label": "Warehouses", "icon": "warehouse", "route": "/app/warehouse", "doctype": "Warehouse"},
			],
		},
		{
			"label": "Purchase",
			"items": [
				{"label": "Purchase Orders", "icon": "shopping", "route": "/app/purchase-order", "doctype": "Purchase Order"},
				{"label": "Purchase Invoices", "icon": "file-document", "route": "/app/purchase-invoice", "doctype": "Purchase Invoice"},
			],
		},
		{
			"label": "Reports",
			"items": [
				{"label": "Sales Analytics", "icon": "chart-box", "route": "/app/query-report/Sales Analytics", "doctype": "Sales Order"},
				{"label": "Stock Reports", "icon": "chart-box", "route": "/app/stock-ledger-entry", "doctype": "Stock Ledger Entry"},
			],
		},
		{
			"label": "System",
			"items": [
				{"label": "Users", "icon": "account-multiple", "route": "/app/user", "doctype": "User"},
				{"label": "Settings", "icon": "cog", "route": "/app/system-settings", "doctype": "System Settings"},
			],
		},
	]

	filtered_sections = []
	for section in nav_sections:
		visible_items = [
			item
			for item in section["items"]
			if item["doctype"] is None or frappe.has_permission(item["doctype"], "read")
		]
		if visible_items:
			filtered_sections.append({"label": section["label"], "items": visible_items})

	context.nav_sections = filtered_sections
	return context
