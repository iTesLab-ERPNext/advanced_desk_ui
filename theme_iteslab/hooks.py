from theme_iteslab.compat import desk_css

app_name = "theme_iteslab"
app_title = "Theme ItesLab"
app_publisher = "ItesLab"
app_description = "Modern UI/UX theme layer for ERPNext v15 and v16"
app_email = "hello@example.com"
app_license = "mit"

# ---------------------------------------------------------------------------
# Assets
# ---------------------------------------------------------------------------
# Frappe builds every file matching *.bundle.css / *.bundle.js found under
# public/ with esbuild, and resolves the bundle name through assets.json.
#
# Each stylesheet is registered as its own bundle rather than a single entry
# file that @imports the others. Frappe copies each style bundle into a temp
# directory before running postcss (once per output variant), so an entry that
# imports sibling files cannot resolve them and the build fails.
#
# The list is version-aware: desk_css() picks the v15 shell (top navbar + the
# page-layout sidebar) or the v16 shell (no navbar, global body sidebar) from
# the running Frappe version. See theme_iteslab/compat.py for the full delta.
#
# Nothing here overwrites a Frappe or ERPNext asset; the bundles are appended
# after the core ones so the theme wins on equal specificity.

app_include_css = desk_css()

app_include_js = "iteslab.bundle.js"

# Login page and any portal/website page. Unchanged between v15 and v16.
web_include_css = [
	"iteslab-variables.bundle.css",
	"iteslab-login.bundle.css",
	"iteslab-rtl.bundle.css",
]

web_include_js = "iteslab-web.bundle.js"

# ---------------------------------------------------------------------------
# Boot
# ---------------------------------------------------------------------------
# The saved palette and the detected shell travel inside frappe.boot, so the
# Desk can paint on the first frame instead of after an extra XHR.

extend_bootinfo = "theme_iteslab.boot.boot_session"
update_website_context = "theme_iteslab.boot.update_website_context"

# ---------------------------------------------------------------------------
# Installation lifecycle
# ---------------------------------------------------------------------------

after_install = "theme_iteslab.install.after_install"
after_migrate = "theme_iteslab.install.after_migrate"
after_app_install = "theme_iteslab.install.after_app_install"

# ---------------------------------------------------------------------------
# Document events
# ---------------------------------------------------------------------------
# Only the theme's own Single DocType is touched. No ERPNext DocType is hooked,
# so no business logic is affected.

doc_events = {
	"Theme Settings": {
		"on_update": "theme_iteslab.api.clear_theme_cache",
	}
}
