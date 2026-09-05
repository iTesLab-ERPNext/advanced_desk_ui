app_name = "theme_myrmex"
app_title = "Theme Myrmex"
app_publisher = "Myrmex"
app_description = "Modern UI/UX theme layer for ERPNext v15"
app_email = "hello@example.com"
app_license = "mit"

# ---------------------------------------------------------------------------
# Assets
# ---------------------------------------------------------------------------
# Frappe v15 builds every file matching *.bundle.css / *.bundle.js found under
# public/ with esbuild, and resolves the bundle name through assets.json.
# Nothing here overwrites a Frappe or ERPNext asset; the bundles are appended
# after the core ones so the theme wins on equal specificity.

app_include_css = "myrmex.bundle.css"
app_include_js = "myrmex.bundle.js"

# Login page and any portal/website page.
web_include_css = "myrmex-web.bundle.css"
web_include_js = "myrmex-web.bundle.js"

# ---------------------------------------------------------------------------
# Boot
# ---------------------------------------------------------------------------
# The saved palette travels inside frappe.boot, so the Desk can paint the
# variables on the first frame instead of after an extra XHR.

extend_bootinfo = "theme_myrmex.boot.boot_session"
update_website_context = "theme_myrmex.boot.update_website_context"

# ---------------------------------------------------------------------------
# Installation lifecycle
# ---------------------------------------------------------------------------

after_install = "theme_myrmex.install.after_install"
after_migrate = "theme_myrmex.install.after_migrate"
after_app_install = "theme_myrmex.install.after_app_install"

# ---------------------------------------------------------------------------
# Document events
# ---------------------------------------------------------------------------
# Only the theme's own Single DocType is touched. No ERPNext DocType is hooked,
# so no business logic is affected.

doc_events = {
	"Theme Settings": {
		"on_update": "theme_myrmex.api.clear_theme_cache",
	}
}
