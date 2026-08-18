from . import __version__ as app_version  # noqa

app_name = "custom_erp_ui"
app_title = "Custom ERP UI"
app_publisher = "Your Company"
app_description = "Modern dashboard UI layer for a custom Frappe/ERPNext app"
app_email = "you@example.com"
app_license = "MIT"

# Assets used by the /erp_dashboard www page are loaded directly in
# index.html via /assets/custom_erp_ui/... links, so nothing needs to be
# registered globally here. If you want the same design system available
# inside Desk pages too, uncomment these:
#
# app_include_css = "/assets/custom_erp_ui/css/erp_dashboard.css"
# app_include_js = "/assets/custom_erp_ui/js/erp_dashboard.js"

website_route_rules = [
	{"from_route": "/dashboard", "to_route": "erp_dashboard"},
]
