// Verifies the logout module against the REAL markup of both Desks.
//
// v15 fragment: frappe/public/js/frappe/ui/toolbar/navbar.html (version-15),
//   settings_dropdown action items render as
//   <button class="btn-reset dropdown-item" onclick="return {{item.action}}">
//   and hooks.py gives Log out the action "frappe.app.logout()".
// v16 fragment: frappe/public/js/frappe/ui/sidebar/sidebar_header.js
//   (version-16) renders <div class="dropdown-menu-item" data-name="logout">.

const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const V15_MENU = `
<header class="navbar navbar-expand"><div class="container">
  <ul class="navbar-nav">
    <li class="nav-item dropdown dropdown-navbar-user dropdown-mobile">
      <button class="btn-reset nav-link" data-toggle="dropdown">AV</button>
      <div class="dropdown-menu dropdown-menu-right" id="toolbar-user" role="menu">
        <a class="dropdown-item" href="/app/user-profile">My Profile</a>
        <button class="btn-reset dropdown-item" onclick="return frappe.ui.toolbar.clear_cache()">Reload</button>
        <div class="dropdown-divider"></div>
        <button class="btn-reset dropdown-item" onclick="return frappe.app.logout()">Log out</button>
      </div>
    </li>
  </ul>
</div></header>`;

const V16_MENU = `
<div class="body-sidebar-container expanded"><div class="body-sidebar">
  <a class="sidebar-header"><div class="title-container"><div class="header-title">Home</div></div></a>
  <div class="sidebar-header-menu">
    <div class="dropdown-menu-item" data-name="my_profile"><span class="menu-item-title">My Profile</span></div>
    <div class="dropdown-menu-item" data-name="toggle_theme"><span class="menu-item-title">Toggle Theme</span></div>
    <div class="dropdown-menu-item" data-name="logout"><span class="menu-item-title">Logout</span></div>
  </div>
  <div class="body-sidebar-top"><div class="sidebar-items"></div></div>
</div></div>`;

function harness(bodyHtml, shell) {
  // runScripts lets window.eval execute in the window's own scope, so the
  // module sees `frappe` and `__` as globals exactly as it does in a browser.
  const dom = new JSDOM(`<!doctype html><html><body>${bodyHtml}</body></html>`, {
    url: "https://site.test/app/home",
    runScripts: "outside-only",
  });
  const { window } = dom;

  global.window = window;
  global.document = window.document;
  window.__ = (s) => s;

  const calls = { logout: 0, confirmed: 0, redirect: null, cleared: false };

  window.frappe = {
    confirm: (msg, onYes) => { calls.confirmed++; onYes(); },
    call: (opts) => { calls.logout++; opts.callback({ message: "Logged Out" }); },
    msgprint: () => {},
    utils: { escape_html: (s) => s },
  };

  window.iteslab = {
    ROOT: window.document.documentElement,
    ready: (fn) => fn(),
    compat: { shell, isV15: () => shell === "v15", isV16: () => shell === "v16" },
  };

  const src = fs
    .readFileSync(path.join(__dirname, "../../public/js/iteslab-logout.js"), "utf8")
    .replace(/^export default.*$/m, "");
  window.eval(src);

  // Observe the two side effects instead of performing them: jsdom will not
  // let window.location be replaced, and a real navigation proves nothing.
  const logout = window.iteslab.logout;
  logout.redirect = (url) => { calls.redirect = url; };
  const origClear = logout.clearClientState.bind(logout);
  logout.clearClientState = () => { calls.cleared = true; origClear(); };

  return { window, calls };
}

let failures = 0;
function check(name, cond) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) failures++;
}

// --- v15 ------------------------------------------------------------------
{
  const { window, calls } = harness(V15_MENU, "v15");
  const doc = window.document;

  // The logout button is found by structure, never by its label.
  const logoutBtn = [...doc.querySelectorAll("#toolbar-user .dropdown-item")]
    .find((b) => (b.getAttribute("onclick") || "").includes("logout"));

  let inlineRan = false;
  logoutBtn.addEventListener("click", () => { inlineRan = true; });

  logoutBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));

  check("v15: control identified in #toolbar-user", !!logoutBtn);
  check("v15: confirm dialog shown", calls.confirmed === 1);
  check("v15: logout endpoint called once", calls.logout === 1);
  check("v15: client state cleared", calls.cleared === true);
  check("v15: redirected to /login", calls.redirect === "/login");
  check("v15: native inline handler suppressed (no double confirm)", inlineRan === false);

  // Other action items must be untouched.
  const reload = [...doc.querySelectorAll("#toolbar-user .dropdown-item")]
    .find((b) => (b.getAttribute("onclick") || "").includes("clear_cache"));
  const before = calls.logout;
  reload.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
  check("v15: non-logout menu items ignored", calls.logout === before);

  // A plain profile link must still navigate.
  const profile = doc.querySelector('#toolbar-user a[href="/app/user-profile"]');
  const ev = new window.MouseEvent("click", { bubbles: true, cancelable: true });
  profile.dispatchEvent(ev);
  check("v15: profile link not intercepted", ev.defaultPrevented === false);
}

// --- v16 ------------------------------------------------------------------
{
  const { window, calls } = harness(V16_MENU, "v16");
  const doc = window.document;

  const logoutItem = doc.querySelector('.dropdown-menu-item[data-name="logout"]');
  logoutItem.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));

  check("v16: control identified in .sidebar-header-menu", !!logoutItem);
  check("v16: confirm dialog shown", calls.confirmed === 1);
  check("v16: logout endpoint called once", calls.logout === 1);
  check("v16: redirected to /login", calls.redirect === "/login");
  check("v16: header menu closed", doc.querySelector(".sidebar-header-menu").classList.contains("hidden"));

  const other = doc.querySelector('.dropdown-menu-item[data-name="toggle_theme"]');
  const before = calls.logout;
  other.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
  check("v16: sibling menu items ignored", calls.logout === before);

  // Clicking the label inside the item must still work (event.target is the span).
  const { window: w2, calls: c2 } = harness(V16_MENU, "v16");
  w2.document.querySelector('[data-name="logout"] .menu-item-title')
    .dispatchEvent(new w2.MouseEvent("click", { bubbles: true, cancelable: true }));
  check("v16: click on inner label still logs out", c2.logout === 1);
}

// --- failure path ---------------------------------------------------------
{
  const { window, calls } = harness(V16_MENU, "v16");
  window.frappe.call = (opts) => opts.error({ status: 500 });
  let reported = false;
  window.frappe.msgprint = () => { reported = true; };
  window.document.querySelector('[data-name="logout"]')
    .dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
  check("server error: no redirect, user told", calls.redirect === null && reported === true);

  const { window: w3, calls: c3 } = harness(V16_MENU, "v16");
  w3.frappe.call = (opts) => opts.error({ status: 401 });
  w3.document.querySelector('[data-name="logout"]')
    .dispatchEvent(new w3.MouseEvent("click", { bubbles: true, cancelable: true }));
  check("401 (session already gone): treated as logged out", c3.redirect === "/login");
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures ? 1 : 0);
