# Browser-side tests

These run the theme's JavaScript against the **real markup** of both Desks,
copied from Frappe's own templates:

* `logout.test.js` — the v15 navbar user dropdown
  (`frappe/public/js/frappe/ui/toolbar/navbar.html`, action items rendered as
  `<button class="btn-reset dropdown-item" onclick="return frappe.app.logout()">`)
  and the v16 sidebar header menu
  (`frappe/public/js/frappe/ui/sidebar/sidebar_header.js`,
  `.dropdown-menu-item[data-name="logout"]`).
* `compat.test.js` — shell detection and the selectors each shell exposes.
* `theme_builder.test.js` — the builder's tabs against the Theme Settings
  DocType: every tab edits a field that exists, every stored setting is
  reachable from some tab, and no field appears twice. The middle check is the
  one that would have caught the missing Tables tab.

They need only Node and jsdom, not a bench:

```bash
npm install jsdom
node theme_iteslab/tests/js/logout.test.js
node theme_iteslab/tests/js/compat.test.js
node theme_iteslab/tests/js/theme_builder.test.js
```

If Frappe changes either menu's markup, these fail loudly instead of the
logout button quietly doing nothing.
