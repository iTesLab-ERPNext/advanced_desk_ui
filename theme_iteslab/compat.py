"""Version compatibility layer.

Theme ItesLab supports Frappe/ERPNext v15 and v16. The two Desks are not
cosmetically different — they are structurally different, and every difference
that matters to a theme is recorded here so the rest of the app never has to
guess.

What actually changed between v15 and v16
-----------------------------------------
1. The top navbar is gone in v16. In v15 the Desk renders
   `header.navbar` (brand, search `#navbar-search`, notifications, help and the
   user dropdown `#toolbar-user`). In v16 `navbar.html` renders only the
   announcement widget, and the whole shell moved into the sidebar.

2. The sidebar container changed.
   v15: `.layout-side-section > .list-sidebar.overlay-sidebar > .desk-sidebar`
        — it lives inside the page layout and has no collapse control.
   v16: `.body-sidebar-container(.expanded) > .body-sidebar`
        — a global shell with its own collapse button
        (`.collapse-sidebar-link.sidebar-toggle-btn`), a `.sidebar-resize-handle`
        and its own `.overlay` for mobile.

   The item markup is shared: `.sidebar-item-container`, `.standard-sidebar-item`,
   `.item-anchor`, `.sidebar-item-icon`, `.sidebar-item-label`. v15 additionally
   puts `.desk-sidebar-item` on the item row.

3. Logout moved. v15 renders it in the user dropdown as
   `<button class="btn-reset dropdown-item" onclick="return frappe.app.logout()">`.
   v16 renders it in the sidebar header menu as
   `.dropdown-menu-item[data-name="logout"]`.

4. v16 adds the espresso token set (`--ink-gray-*`, `--surface-gray-*`,
   `--outline-gray-*`). The older semantic variables (`--bg-color`, `--fg-color`,
   `--card-bg`, `--control-bg`, `--border-color`, `--navbar-bg`,
   `--sidebar-select-color`) exist in both, so the core variable bridge is shared
   and only the espresso bridge is v16-only.

What did NOT change (and so stays shared)
-----------------------------------------
`app_include_css` / `app_include_js` / `web_include_*`, `extend_bootinfo`,
Single DocTypes, standard Desk Pages, `frappe.router.on("change")`, the
`page-change` event, and the theme switcher (`frappe.ui.set_theme`, the
`data-theme` / `data-theme-mode` attributes on `<html>`).
"""

import frappe

# The major version this package was cut for. The two published packages differ
# in this constant, their pyproject pin and their README; everything else is
# identical, and detection below still wins at runtime so a package installed on
# the other major degrades to the correct shell instead of breaking.
PACKAGE_TARGET = 15

SUPPORTED_MAJORS = (15, 16)


def frappe_major() -> int:
	"""The running Frappe major version, or the package target if unreadable."""
	try:
		return int(str(frappe.__version__).split(".")[0])
	except Exception:
		return PACKAGE_TARGET


def shell() -> str:
	"""Which Desk shell to style: "v15" (navbar + page sidebar) or "v16"."""
	major = frappe_major()
	if major >= 16:
		return "v16"
	return "v15"


def is_supported() -> bool:
	return frappe_major() in SUPPORTED_MAJORS


# --- asset selection -------------------------------------------------------
# Shared layers, in cascade order. Tokens first, shell in the middle, then the
# content layers, then dark and responsive overrides last.

SHARED_CSS_BEFORE_SHELL = [
	"iteslab-variables.bundle.css",
	"iteslab-base.bundle.css",
]

SHELL_CSS = {
	"v15": ["iteslab-shell-v15.bundle.css"],
	"v16": ["iteslab-shell-v16.bundle.css"],
}

SHARED_CSS_AFTER_SHELL = [
	"iteslab-components.bundle.css",
	"iteslab-workspace.bundle.css",
	"iteslab-forms.bundle.css",
	"iteslab-lists.bundle.css",
	"iteslab-dark.bundle.css",
	"iteslab-responsive.bundle.css",
	# Last: RTL typography corrections, which must win over everything above.
	# Frappe runs every bundle through rtlcss and serves rtl_*.css for ar/he/fa/ps,
	# so this file only carries what rtlcss cannot infer. See the file header.
	"iteslab-rtl.bundle.css",
]


def desk_css() -> list[str]:
	"""The stylesheet list for app_include_css, ordered for the cascade."""
	return SHARED_CSS_BEFORE_SHELL + SHELL_CSS[shell()] + SHARED_CSS_AFTER_SHELL
