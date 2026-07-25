app_name = "aurora_theme"
app_title = "Aurora Theme"
app_publisher = "Your Company"
app_description = "A cool-toned, aurora-inspired ERPNext desk theme with animated workspace icons and a customer portal dashboard."
app_email = "dev@yourcompany.com"
app_license = "mit"
required_apps = ["frappe"]

# --------------------------------------------------------------------------
# Assets — Desk (additive overlay: nothing here replaces core templates)
# --------------------------------------------------------------------------

app_include_css = [
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
    "/assets/aurora_theme/css/aurora_theme.css",
]

app_include_js = [
    "https://cdn.jsdelivr.net/npm/iconify-icon@2.1.0/dist/iconify-icon.min.js",
    "/assets/aurora_theme/js/aurora_theme.js",
]

# --------------------------------------------------------------------------
# Assets — Website / Portal / Login (login is overlay-only: background +
# a dark-mode toggle layered on Frappe's existing login form, not a
# template override, to avoid regressing the auth flow on real sites)
# --------------------------------------------------------------------------

web_include_css = [
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
    "/assets/aurora_theme/css/aurora_theme.css",
    "/assets/aurora_theme/css/aurora_login.css",
    "/assets/aurora_theme/css/aurora_portal.css",
]

web_include_js = [
    "/assets/aurora_theme/js/aurora_login.js",
    "/assets/aurora_theme/js/aurora_portal.js",
]

# --------------------------------------------------------------------------
# Boot session — pushes Theme Settings colors/fonts into frappe.boot
# --------------------------------------------------------------------------

extend_bootinfo = "aurora_theme.boot.boot_session"

# --------------------------------------------------------------------------
# Workspace icon picker (adds a "Pick Animated Icon" button + preview to
# the Workspace form; the underlying field is a plain Data custom field)
# --------------------------------------------------------------------------

doctype_js = {"Workspace": "public/js/workspace_icon_picker.js"}

# --------------------------------------------------------------------------
# Customer portal dashboard — a route this app owns outright, so a full
# page here carries none of the risk a Desk shell override would.
# --------------------------------------------------------------------------

website_route_rules = [
    {"from_route": "/dashboard", "to_route": "portal_dashboard"},
]

portal_menu_items = [
    {"title": "Dashboard", "route": "/dashboard", "role": "Customer"},
]

# --------------------------------------------------------------------------
# Installation
# --------------------------------------------------------------------------

after_install = "aurora_theme.install.after_install"
after_migrate = "aurora_theme.install.after_migrate"
