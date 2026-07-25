# Aurora Theme

A cool-toned, "northern lights" ERPNext desk theme — violet, emerald, and
cyan on a dark, gradient-lit sidebar, with the main content area kept
bright. Built independently, inspired only by the *feature set* of
[naidapa_theme](https://github.com/iammusabutt/naidapa_theme) (branding
settings, animated workspace icons, a customer portal dashboard, a
restyled login page) — no code, assets, or CSS from that repo are reused;
the palette, layout, and every file here are original.

## Features

- **Theme Settings** (System Manager only) — sidebar logo, title, favicon,
  primary/secondary/accent colors, heading/body font, and login page copy
  (tag line, short notes, description). Colors apply instantly via CSS
  variables; no rebuild needed for a color change.
- **Animated workspace icons** — a `Pick Animated Icon` button on the
  Workspace form lets you choose an Iconify icon code (e.g.
  `ph:rocket-launch-duotone`) with a live preview grid; free-text entry
  also accepts any valid Iconify code beyond the starter set.
- **Custom sidebar + navbar** — dark, gradient-lit sidebar with nested
  workspaces, a pill search box, dark-mode toggle, and a mobile drawer.
- **Customer Portal Dashboard** (`/dashboard`) — order/invoice/outstanding/
  open-issue stats for portal (Customer) users, resolved via the standard
  User → Contact → Customer link.
- **Login page** — aurora gradient background + dark-mode toggle layered
  on top of Frappe's existing login form.

## A deliberate architectural difference from Naidapa

Naidapa fully overrides `www/app.py` **and** `www/app.html` — it replaces
the entire Desk shell template. That's a legitimate technique, but it's
also the highest-risk piece of a theme: get it wrong and the Desk renders
blank for everyone, and it's very hard to verify without a live instance
to test against.

Aurora achieves the same *visible* result — a custom sidebar/navbar with
animated icons — a different way: it renders them as a DOM overlay on top
of the stock Desk (same technique proven out in this developer's other
theme project), fed by a small whitelisted method
(`events.sidebar.get_sidebar_pages`) that reuses Frappe's own
`get_workspace_sidebar_items` / `get_desktop_page` APIs. Nothing here can
break the underlying Desk boot — worst case, the overlay simply doesn't
render and you see stock ERPNext.

The one place this app *does* ship a full custom page is the Customer
Portal Dashboard, because that route belongs entirely to this app — there
is no core template to conflict with, so there's no equivalent risk.

If you'd prefer the literal full-shell-override approach Naidapa uses,
that's a bigger, riskier change I'd want to build and reason through
carefully (and ideally test against a real site) rather than ship
speculatively — say the word and we can do that as a follow-up.

## Install

```bash
bench get-app aurora_theme /path/to/this/repo
bench --site your-site.local install-app aurora_theme
bench build --app aurora_theme
bench --site your-site.local clear-cache
```

Then go to **Aurora Theme → Theme Settings** to set your logo, colors,
and login copy.

## Architecture

```
aurora_theme/
├── hooks.py                  # asset includes, boot session, doctype_js,
│                              # portal route, install hooks
├── boot.py                   # extend_bootinfo: pushes Theme Settings
│                              # colors/fonts into frappe.boot
├── install.py                 # adds the `aurora_animated_icon` custom
│                              # field to Workspace
├── events/
│   └── sidebar.py             # get_sidebar_pages(): nested workspace +
│                              # card + animated-icon data, reusing core
│                              # desktop APIs (no duplicated logic)
├── config/
│   └── desktop.py             # module icon/label
├── aurora_theme/               # ⚠ module folder — must match modules.txt
│   └── doctype/
│       └── theme_settings/    # Single doctype: branding, colors, fonts
├── www/
│   ├── portal_dashboard.py    # customer stats controller
│   └── portal_dashboard.html  # extends templates/web.html
└── public/
    ├── css/
    │   ├── aurora_theme.css   # desk sidebar/navbar/workspace-card design
    │   ├── aurora_login.css   # login page overlay (background, toggle)
    │   └── aurora_portal.css  # portal dashboard styling
    └── js/
        ├── aurora_theme.js         # sidebar/navbar overlay + dark mode
        ├── aurora_login.js         # login page overlay
        ├── aurora_portal.js        # stat counter animation
        └── workspace_icon_picker.js # icon picker for the Workspace form
```

## License

MIT
