# Advanced Desk UI

A modern, SaaS-style Desk theme and UX layer for **ERPNext v15+**, inspired by
Linear / Notion / Stripe Dashboard / Vercel / Naidapa — implemented as a
100% custom Frappe app. **No ERPNext core files are modified.**

This repo currently ships **Phase 1 + Phase 2**:

**Phase 1 — Foundation**
- Project architecture & folder structure
- `hooks.py` wiring (assets, boot session, fixtures, scheduler, doc events)
- Theme engine: CSS-variable design tokens, Light / Dark / Auto, per-user
  persistence, instant-paint via localStorage + `frappe.boot`
- `Advanced Desk Settings` — single doctype admin control panel for
  branding & tokens (logos, colors, radius, animation speed, dashboard
  layout default)

**Phase 2 — Sidebar, Navbar, Dashboard, Workspace**
- **Sidebar** (`components/sidebar.bundle.js`) — collapsible, resizable
  (drag handle, clamped width), Favorites/Recent/Workspaces sections,
  inline search, active-route highlighting. Renders alongside core's
  DOM rather than replacing it, so every workspace permission/route still
  works exactly as ERPNext built it.
- **Navbar** (`components/navbar.bundle.js`) — theme toggle
  (Light/Dark/Auto), fullscreen toggle, multi-company switcher (hidden
  automatically on single-company sites). Augments the existing navbar
  instead of duplicating Quick Create/Notifications/Search, which core
  already provides.
- **Command Palette** (`components/command_palette.bundle.js`) — Ctrl+K
  overlay with static commands (new doc, toggle theme, toggle sidebar,
  logout) plus live search against the same permission-aware endpoint the
  sidebar uses.
- **Global Search** (`components/global_search.bundle.js`) — re-points
  the stock navbar search icon at the same Command Palette overlay
  (one search surface, one backend, no duplicated logic).
- **Dashboard widgets** (`widgets/dashboard.js`) — KPI, Recent Documents,
  Pending Approvals, Tasks, Projects, Calendar, Announcements, and
  Shortcuts widgets on the Desk home page. Drag-to-reorder (SortableJS)
  and S/M/L resize, saved per-user via `ADU Dashboard Layout`.
- **Workspace redesign** (`overrides/workspace_overrides.js`) — gradient
  icon backgrounds and a grid/list view toggle layered onto existing
  workspace shortcut cards.

New doctypes: `ADU Favorite` (per-user starred workspaces/reports/
doctypes) and `ADU Dashboard Layout` (per-user widget grid). Both are
owner-restricted at the row level regardless of role.

New API surface: `api/sidebar.py` (favorites, recents via core Route
History, permission-aware search) and `api/dashboard.py` (widget data,
layout get/save).

Phase 3 (forms, list views, login page, user-preferences UI, final
optimization) is also included below — this repo now ships all three
phases from the original spec.

**Phase 3 — Forms, Lists, Login, Preferences, Polish**
- **Forms** (`overrides/form_overrides.js`, wired via `doctype_js["*"]`) —
  sticky toolbar, floating save button (visible only while dirty),
  mandatory-field progress bar, collapsible sections, sticky child-table
  headers, inline image previews on attachments, 30s idle autosave for
  existing (non-single, non-submitted) docs, an extra keyboard shortcut.
- **List views** (`overrides/list_overrides.js`) — sticky header, a
  column-picker dialog (hides columns via CSS, preference kept in
  localStorage per doctype), and a quick-filter chip row generated from
  the doctype's `status` field when present. Bulk actions, export/import,
  and pagination are left to core, which already implements them well.
- **Login page** (`public/js/pages/login.js` + `scss/login.scss`) —
  animated gradient blobs, a theme toggle, and a language selector layered
  on top of Frappe's existing login form; the form fields and auth flow
  are untouched.
- **User Preferences dialog** (`public/js/pages/user_preferences.js`) —
  one panel for theme, density, sidebar width, animations, and language;
  reachable from the navbar user menu and the command palette. Backed by
  `api/preferences.save_preferences` / `get_preferences`.
- **Accessibility & responsiveness** (`scss/_accessibility.scss`,
  `scss/_responsive.scss`) — focus-visible outlines, `prefers-reduced-motion`
  support, `forced-colors` handling, a mobile sidebar drawer with a
  hamburger toggle and swipe-to-close, larger touch targets on coarse
  pointers.
- **Performance** (`public/js/utils.js`) — a shared `debounce` (used by
  sidebar/command-palette search) and an `IntersectionObserver`-based
  `lazyRun` helper, so debouncing/lazy-loading logic isn't reimplemented
  per component.

## Install

```bash
bench get-app advanced_desk_ui /path/to/this/repo
bench --site your-site.local install-app advanced_desk_ui
bench build --app advanced_desk_ui
bench --site your-site.local clear-cache
```

## Configure

Go to **Advanced Desk UI → Advanced Desk Settings** (System Manager only)
and set your primary color, logos, radius, and default theme. Changes take
effect on next page load — the theme cache is cleared automatically via the
`on_update` doc event.

## Architecture

```
advanced_desk_ui/
├── hooks.py                 # app wiring — assets, boot, fixtures, events
├── boot.py                  # extend_bootinfo: pushes tokens+prefs to client
├── config/
│   └── desktop.py           # module icon/label
├── doctype/
│   ├── advanced_desk_settings/   # admin control panel (Single doctype)
│   ├── adu_favorite/             # per-user starred sidebar items
│   └── adu_dashboard_layout/     # per-user dashboard widget layout
├── api/
│   ├── preferences.py       # whitelisted endpoints (theme mode, density)
│   ├── sidebar.py           # favorites, recents, permission-aware search
│   └── dashboard.py         # widget data sources, layout get/save
├── utils/
│   ├── theme.py             # builds CSS var dict from settings, cached
│   └── cache.py             # invalidation on save + daily warmup
├── fixtures/
│   └── custom_field.json    # 2 User fields: adu_theme_mode, adu_density
└── public/
    ├── scss/                # variables, sidebar, navbar, command-palette,
    │                        # dashboard, workspace, forms, list,
    │                        # accessibility, responsive → theme.scss
    │                        # + login.scss (separate login.css bundle)
    └── js/
        ├── utils.js          # shared debounce + lazyRun (IntersectionObserver)
        ├── theme_engine.js  # resolves + applies theme, Auto/system watch
        ├── components/      # sidebar, navbar, command_palette, global_search
        ├── widgets/dashboard.js   # widget grid, drag/resize, persistence
        ├── overrides/        # workspace_overrides.js, desk_overrides.js,
        │                     # form_overrides.js, list_overrides.js
        └── pages/            # login.js, user_preferences.js
```

### How theming works end-to-end

1. `Advanced Desk Settings` (Single doctype) holds the admin-configured
   tokens (colors, radius, sidebar/navbar size, animation toggle, etc.).
2. `utils/theme.get_active_theme_vars()` turns that doc into a flat
   `{css_var_name: value}` dict, cached in Redis.
3. `boot.boot_session()` (via `extend_bootinfo`) pushes that dict, plus the
   *current user's* saved theme mode/density, into `frappe.boot.advanced_desk_ui`.
4. `theme_engine.js` reads `frappe.boot` on `app_ready`, sets
   `data-theme` / `data-density` / `data-animations` attributes on
   `<html>`, and writes the CSS variables onto `:root`. It also caches the
   last-applied mode in `localStorage` so the *next* load paints correctly
   before `frappe.boot` is even available.
5. When the user toggles the theme (Phase 2 navbar toggle), it calls
   `advanced_desk_ui.theme.setMode()`, which updates the DOM immediately
   and persists the choice via `api/preferences.set_theme_mode`.
6. Saving `Advanced Desk Settings` fires `on_update`, which clears the
   Redis cache so the next request rebuilds tokens from the new values.

No ERPNext template, JS, or Python file is edited — everything is additive
via `app_include_css` / `app_include_js` / `extend_bootinfo` / fixtures.
