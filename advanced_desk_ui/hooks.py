from . import __version__ as app_version

app_name = "advanced_desk_ui"
app_title = "Advanced Desk UI"
app_publisher = "Your Company"
app_description = "Modern SaaS-style Desk theme and UX layer for ERPNext v15+ (Naidapa-inspired, fully custom)."
app_email = "dev@yourcompany.com"
app_license = "MIT"
app_version = app_version

# --------------------------------------------------------------------------
# Assets — injected on top of the Desk, core files are never modified.
# --------------------------------------------------------------------------

app_include_css = [
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap",
    "/assets/advanced_desk_ui/css/theme.css",
]

app_include_js = [
    # External libs used by Phase 2 widgets (per the original spec's tech
    # list). Loaded from cdnjs so no binary vendor files ship in the repo;
    # each usage site (dashboard drag/drop, workspace icons) degrades
    # gracefully if the CDN is unreachable.
    "https://cdnjs.cloudflare.com/ajax/libs/feather-icons/4.29.1/feather.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.2/Sortable.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.4/chart.umd.min.js",
    # Theme engine must load before any component that reads theme state
    "/assets/advanced_desk_ui/js/utils.js",
    "/assets/advanced_desk_ui/js/theme_engine.js",
    "/assets/advanced_desk_ui/js/components/sidebar.bundle.js",
    "/assets/advanced_desk_ui/js/components/navbar.bundle.js",
    "/assets/advanced_desk_ui/js/components/command_palette.bundle.js",
    "/assets/advanced_desk_ui/js/components/global_search.bundle.js",
    "/assets/advanced_desk_ui/js/widgets/dashboard.js",
    "/assets/advanced_desk_ui/js/overrides/workspace_overrides.js",
    "/assets/advanced_desk_ui/js/overrides/list_overrides.js",
    "/assets/advanced_desk_ui/js/pages/user_preferences.js",
    "/assets/advanced_desk_ui/js/overrides/desk_overrides.js",
]

web_include_css = [
    "/assets/advanced_desk_ui/css/login.css",
]

web_include_js = [
    "/assets/advanced_desk_ui/js/pages/login.js",
]

# Runs on every DocType form — see public/js/overrides/form_overrides.js
doctype_js = {"*": "public/js/overrides/form_overrides.js"}

# --------------------------------------------------------------------------
# Boot session — pushes Advanced Desk Settings + per-user prefs into
# frappe.boot so the theme engine can apply them before first paint.
# --------------------------------------------------------------------------

extend_bootinfo = "advanced_desk_ui.boot.boot_session"

# --------------------------------------------------------------------------
# Website context (branded login page)
# --------------------------------------------------------------------------

# Populated dynamically from Advanced Desk Settings (favicon/background are
# admin-uploaded attachments, not static files shipped in the repo).
update_website_context = "advanced_desk_ui.utils.theme.update_website_context"

# --------------------------------------------------------------------------
# Fixtures — ship the singleton settings doctype config-driven, not hardcoded
# --------------------------------------------------------------------------

fixtures = [
    {"dt": "Advanced Desk Settings"},
    {
        "dt": "Custom Field",
        "filters": [["module", "=", "Advanced Desk UI"]],
    },
]

# --------------------------------------------------------------------------
# Scheduler events — placeholder for future cache warmup / cleanup jobs
# --------------------------------------------------------------------------

scheduler_events = {
    "daily": [
        "advanced_desk_ui.utils.cache.warm_theme_cache",
    ],
}

# --------------------------------------------------------------------------
# Document events — placeholder, e.g. invalidate cached CSS variables when
# Advanced Desk Settings is updated.
# --------------------------------------------------------------------------

doc_events = {
    "Advanced Desk Settings": {
        "on_update": "advanced_desk_ui.utils.cache.clear_theme_cache",
    }
}

# --------------------------------------------------------------------------
# Jinja helpers available in templates (login page, www pages)
# --------------------------------------------------------------------------

jinja = {
    "methods": [
        "advanced_desk_ui.utils.theme.get_active_theme_vars_jinja",
    ]
}

# --------------------------------------------------------------------------
# Required apps
# --------------------------------------------------------------------------

required_apps = ["frappe", "erpnext"]
