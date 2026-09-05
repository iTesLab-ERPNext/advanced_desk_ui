# Theme Myrmex

A modern UI/UX layer for **ERPNext v15** running on **Frappe Framework v15**.

Theme Myrmex restyles the whole Desk — sidebar, navbar, workspaces, forms, list
views, tables, dialogs — without touching a single line of Frappe or ERPNext
source code. All business logic, permissions and the native ERPNext icon set are
left exactly as they are.

---

## 1. What it does

| Area | What changes |
|---|---|
| Sidebar | Modern spacing, active/hover states, collapsed rail mode, mobile drawer, persisted state |
| Navbar | Taller, cleaner, restyled search, avatar, notifications, breadcrumbs |
| Workspaces | Card-based dashboard look for widgets, shortcuts, number cards, charts |
| Forms | Cleaner sections, labels, inputs, tabs, sidebar, comments, attachments |
| List views | Restyled header, filters, rows, status pills, pagination, bulk actions |
| Tables & grids | Better headers, row spacing, hover, optional zebra, horizontal scroll |
| Components | Buttons, inputs, selects, dropdowns, dialogs, tabs, badges |
| Theming | ~30 configurable colors/sizes as CSS custom properties |
| Dark mode | Light / Dark / System, derived automatically from your palette |
| Theme Builder | Visual editor with live preview, presets, save and reset |

### What it deliberately does **not** do

* It does not modify `frappe/` or `erpnext/`.
* It does not replace the ERPNext icon system. Native SVG sprite icons are kept;
  only size, alignment, spacing and colour are adjusted.
* It does not hide, add or bypass any permission-controlled UI. Rendering is
  still entirely Frappe's job.
* It does not add React/Vue/Angular or any large UI library. Plain CSS + vanilla
  JS on top of Frappe's own APIs.

---

## 2. Architecture

Theme Myrmex works through four official Frappe v15 extension points:

1. **`app_include_css` / `app_include_js`** — esbuild bundles injected into the Desk.
2. **`extend_bootinfo`** — the saved theme is delivered inside `frappe.boot`, so
   there is no extra network round-trip and no flash of unstyled content.
3. **A Single DocType (`Theme Settings`)** — stores the configuration and is
   subject to normal Frappe permissions (System Manager writes, everyone reads).
4. **A standard Desk Page (`theme-builder`)** — the visual editor.

The CSS is built as a **variable bridge**. Myrmex declares its own
`--myrmex-*` custom properties and then re-points Frappe's native variables
(`--primary`, `--bg-color`, `--fg-color`, `--text-color`, `--border-color`, …)
at them. That means a large part of the Desk is restyled by variables alone
rather than by brittle selector overrides, and anything Myrmex does not
explicitly target still inherits the palette.

```
theme_myrmex/
├── pyproject.toml
├── license.txt
├── README.md
└── theme_myrmex/
    ├── __init__.py
    ├── hooks.py
    ├── boot.py                  # extend_bootinfo + website context
    ├── api.py                   # whitelisted read/save/preset/reset endpoints
    ├── presets.py               # the five shipped presets + variable map
    ├── install.py               # after_install / after_migrate
    ├── modules.txt
    ├── patches.txt
    ├── templates/
    ├── public/
    │   ├── css/
    │   │   ├── myrmex.bundle.css        # desk bundle entry
    │   │   ├── myrmex-web.bundle.css    # login / website bundle entry
    │   │   ├── myrmex-variables.css     # tokens + bridge to Frappe variables
    │   │   ├── myrmex-base.css
    │   │   ├── myrmex-sidebar.css
    │   │   ├── myrmex-navbar.css
    │   │   ├── myrmex-components.css
    │   │   ├── myrmex-workspace.css
    │   │   ├── myrmex-forms.css
    │   │   ├── myrmex-lists.css
    │   │   ├── myrmex-dark.css
    │   │   ├── myrmex-responsive.css
    │   │   └── myrmex-login.css
    │   └── js/
    │       ├── myrmex.bundle.js         # desk bundle entry
    │       ├── myrmex-web.bundle.js     # login / website bundle entry
    │       ├── myrmex-utils.js          # namespace, route + observer helpers
    │       ├── myrmex-theme.js          # applies variables, dark mode, body flags
    │       ├── myrmex-sidebar.js
    │       ├── myrmex-navbar.js
    │       └── myrmex-workspace.js
    └── myrmex/                          # the "Myrmex" module
        ├── doctype/theme_settings/
        └── page/theme_builder/
```

> Note on layout: the brief sketched `doctype/` and `page/` directly under the
> app package. Frappe v15 requires them to live inside a **module folder** whose
> name matches an entry in `modules.txt`, so they are under `theme_myrmex/myrmex/`
> (module `Myrmex`). Everything else follows the brief.

---

## 3. Installation (Frappe v15)

```bash
cd ~/frappe-bench

# 1. pull the app into the bench
bench get-app /path/to/theme_myrmex
# or: bench get-app https://your-git-host/theme_myrmex.git --branch main

# 2. install it on the site
bench --site your-site.local install-app theme_myrmex

# 3. build the assets
bench build --app theme_myrmex

# 4. run migrations (creates Theme Settings + Theme Builder page)
bench --site your-site.local migrate

# 5. restart
bench restart
```

If the theme does not appear immediately:

```bash
bench --site your-site.local clear-cache
bench --site your-site.local clear-website-cache
bench build --app theme_myrmex --force
bench restart
```

In development, `bench watch` rebuilds the bundles on save.

### Uninstalling

```bash
bench --site your-site.local uninstall-app theme_myrmex
bench --site your-site.local clear-cache
bench restart
```

Because nothing outside the app is patched, removing it returns the Desk to
stock ERPNext.

---

## 4. Using it

**Theme Builder** — `/app/theme-builder` (System Manager only), or from the
Awesomebar type "Theme Builder". Pick a preset, adjust colours and radii, watch
the preview update live, then **Save theme**. Saved changes are pushed to every
open session over Frappe's realtime channel.

**Theme Settings** — `/app/theme-settings` is the raw DocType form for the same
values, useful for scripting or `bench --site … set-config`-style automation.

**Presets** — Myrmex Default, Myrmex Blue, Myrmex Dark, Myrmex Minimal,
Myrmex Enterprise.

**Dark mode** — Myrmex piggybacks on Frappe's own theme switcher
(`data-theme="dark"` on `<html>`), so the user menu → *Toggle theme* keeps
working. Dark values are derived from your palette automatically; your accent
colours carry over.

**Custom CSS** — the *Advanced* section of Theme Settings takes raw CSS that is
appended last, for site-specific tweaks.

---

## 5. Testing checklist

Run through this after installing or after changing colours.

- [ ] Login page renders with the theme palette
- [ ] Desk loads with no flash of unstyled content
- [ ] Sidebar: expand, collapse, tooltips in collapsed mode, active item
- [ ] Sidebar state survives a full page reload
- [ ] Navbar: search, notifications, help, user menu, avatar dropdown
- [ ] Breadcrumbs and back navigation
- [ ] Workspace: cards, shortcuts, number cards, charts, links, recent documents
- [ ] Workspace edit mode still works (drag, add widget, save)
- [ ] List view: search, filters, sort, sidebar, status pills, pagination
- [ ] List view: row selection, bulk actions, "Edit" bulk dialog
- [ ] Report view, Kanban, Calendar, Gantt
- [ ] Form: sections, tabs, collapsible sections, grids, comments, attachments
- [ ] Form: save, submit, cancel, amend; grid row expand dialog
- [ ] Dialogs, dropdowns, awesomplete suggestions, date picker, multiselect
- [ ] Dark mode across every screen above; contrast is readable
- [ ] Theme Builder: preset, live preview, save, reset
- [ ] Colour change reflected in another open browser tab without reload
- [ ] Responsive: desktop, tablet (compact sidebar), mobile (drawer)
- [ ] Permissions: log in as a limited user — no extra links or actions appear
- [ ] Standard ERPNext flows: Sales Order → Delivery Note → Sales Invoice

---

## 6. Compatibility notes

* Targets Frappe v15 and ERPNext v15 only. Selector names in
  `myrmex-sidebar.css` / `myrmex-navbar.css` follow the v15 Desk markup.
* Text on primary-coloured surfaces is chosen by comparing real WCAG contrast
  ratios, so a mid-tone brand colour gets dark text rather than white. That can
  look unfamiliar next to stock Frappe, but it is the readable choice; override
  `--myrmex-primary-contrast` in Custom CSS if you need the other one.
* Nothing is module-specific; the theme applies across Accounting, Selling,
  Buying, Stock, Manufacturing, CRM, Projects, HR, Assets, Support and Website.
* The JS never uses timed guesses. It listens to `frappe.router.on("change")`
  and the `page-change` event, and where a MutationObserver is genuinely needed
  it is scoped to one container, guarded against double-init and disconnected on
  route change (see `myrmex-utils.js`).

## 7. Licence

MIT — see `license.txt`.
