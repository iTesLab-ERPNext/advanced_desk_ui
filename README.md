# custom_erp_ui — Modern ERP Dashboard for Frappe / ERPNext

A drop-in Frappe app that implements the modern blue/orange ERP dashboard
design: dark navy collapsible sidebar, white navbar with global search,
KPI cards, quick-action shortcuts, a sales chart, an order-status
breakdown, and a recent-activity feed.

It's built as a **custom website route** (`/dashboard`) rather than a Desk
page, so you get full control over the sidebar/navbar chrome described in
the spec, while still running inside your Frappe site, reusing Frappe
auth/sessions, and reading live data via whitelisted API calls.

## What's included

```
custom_erp_ui/
├── custom_erp_ui/
│   ├── api/
│   │   └── dashboard.py        # whitelisted endpoints: KPIs, activity, charts
│   ├── public/
│   │   ├── css/erp_dashboard.css   # full design system (colors, cards, badges, dark mode...)
│   │   └── js/erp_dashboard.js     # sidebar/navbar behavior, data fetch + render
│   ├── www/
│   │   └── erp_dashboard/
│   │       ├── index.html      # page shell: sidebar, navbar, KPI/chart/activity containers
│   │       └── index.py        # auth check + server-rendered, permission-filtered nav
│   └── hooks.py
├── setup.py
├── requirements.txt
└── README.md
```

## How it works

- **`www/erp_dashboard/index.py`** runs on every request to `/dashboard`
  (aliased from `/erp_dashboard` via `website_route_rules` in `hooks.py`).
  It blocks guests, and builds the sidebar nav server-side — each link is
  only included if `frappe.has_permission(doctype, "read")` passes for the
  logged-in user, so the frontend never advertises pages the user can't
  open.
- **`index.html`** is the Jinja template for the page shell. It pulls in
  Frappe's own web bundle (`frappe-web.bundle.css/js`) so `frappe.csrf_token`
  and session helpers are available, plus Google Fonts (Inter), Material
  Design Icons, and Chart.js from CDN for the sales line chart.
- **`erp_dashboard.js`** handles all client-side behavior: sidebar
  collapse/expand (persisted in `localStorage`), the user/notification
  dropdowns, debounced global search (via Frappe's built-in
  `frappe.desk.search.search_link`), and rendering the KPI cards, quick
  actions, sales chart, status breakdown, and activity feed from the API.
- **`api/dashboard.py`** exposes four `@frappe.whitelist()` methods:
  `get_kpis`, `get_recent_activity`, `get_sales_chart`,
  `get_order_status_breakdown`. Each one is defensive — if a doctype
  (e.g. `Sales Order`) isn't installed on the site, that KPI just reports
  zero instead of raising, so the dashboard also works on a bare Frappe
  install without ERPNext, and degrades gracefully rather than crashing.

## Installation

```bash
# from your bench directory
bench get-app custom_erp_ui /path/to/custom_erp_ui   # or a git remote
bench --site your-site.local install-app custom_erp_ui
bench --site your-site.local migrate
bench build --app custom_erp_ui
bench restart
```

Then visit `https://your-site.local/dashboard` while logged in.

## Customizing

- **Colors** — every color in the spec is a CSS variable at the top of
  `erp_dashboard.css` (`--erp-blue`, `--erp-orange`, `--erp-sidebar-bg`,
  etc.). Change them once, they cascade everywhere including dark mode.
- **Sidebar sections/links** — edit `nav_sections` in `index.py`. Icons
  use [Material Design Icons](https://pictogrammers.com/library/mdi/)
  names (e.g. `account-group`, `cart`, `warehouse`).
- **Quick actions** — edit the `QUICK_ACTIONS` array in
  `erp_dashboard.js`.
- **KPIs** — add/remove cards in `get_kpis()` in `api/dashboard.py`; the
  frontend renders whatever the API returns, so no JS changes needed for
  a straightforward new KPI.
- **Dark mode** — toggle by setting `data-theme="dark"` on `<body>` (wire
  this up to a theme-switcher button in the navbar if you want a toggle;
  the CSS variables are already in place).

## Notes / assumptions

- This targets Frappe v14/v15-style app structure. If you're on a
  different version, doctype field names for KPIs (e.g.
  `transaction_date`, `posting_date`, `paid_amount`) may need small
  adjustments — check against your site's actual ERPNext version.
- The design intentionally keeps Frappe's Desk (`/app/...`) as the
  system of record for actual CRUD — sidebar links and quick actions
  route into Desk forms/lists rather than reimplementing them, per the
  spec's instruction not to bypass Frappe permissions from the frontend.
- Chart.js and MDI icons are loaded from CDN for simplicity; swap for
  self-hosted assets under `public/` if you need to work offline or
  behind a strict CSP.
