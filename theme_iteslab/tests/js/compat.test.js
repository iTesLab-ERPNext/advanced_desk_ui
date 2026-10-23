// Verifies shell detection: the server's answer is trusted first, the DOM is
// only a fallback, and the result drives the <html> class the CSS keys off.

const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "../../public/js/iteslab-compat.js");

const V16_DOM = '<div class="body-sidebar-container expanded"><div class="body-sidebar"><div class="sidebar-items"></div></div></div>';
const V15_DOM = '<header class="navbar"></header><div class="layout-side-section"><div class="list-sidebar"><div class="desk-sidebar"></div></div></div>';

function load(bodyHtml, boot) {
  const dom = new JSDOM(`<!doctype html><html><body>${bodyHtml}</body></html>`, {
    runScripts: "outside-only",
  });
  const { window } = dom;
  window.frappe = { boot: boot || {} };
  window.iteslab = { ROOT: window.document.documentElement };
  window.eval(fs.readFileSync(SRC, "utf8").replace(/^export default.*$/m, ""));
  return window;
}

let failures = 0;
const check = (name, cond) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) failures++;
};

// Server-supplied answer wins.
{
  const w = load(V15_DOM, { iteslab_theme: { shell: "v16", frappe_major: 16 } });
  check("boot payload decides the shell", w.iteslab.compat.detect() === "v16");
  check("major carried from payload", w.iteslab.compat.major === 16);
  check("html gets the shell class", w.document.documentElement.classList.contains("iteslab-v16"));
}

// No payload: fall back to the structural probe.
{
  const w = load(V16_DOM, {});
  check("DOM probe finds v16 shell", w.iteslab.compat.detect() === "v16");
  check("v16 sidebar root resolves", !!w.iteslab.compat.sidebarRoot());
  check("v16 item host resolves", !!w.iteslab.compat.sidebarItemHost());
  check("v16 reports native collapse", w.iteslab.compat.hasNativeCollapse() === true);
}

{
  const w = load(V15_DOM, {});
  check("DOM probe falls back to v15", w.iteslab.compat.detect() === "v15");
  check("v15 sidebar root resolves", !!w.iteslab.compat.sidebarRoot());
  check("v15 item host resolves", !!w.iteslab.compat.sidebarItemHost());
  check("v15 has no native collapse", w.iteslab.compat.hasNativeCollapse() === false);
}

// Versions map from boot.versions when the payload is missing entirely.
{
  const w = load(V15_DOM, { versions: { frappe: "16.35.0" } });
  check("boot.versions used as last resort", w.iteslab.compat.detect() === "v16");
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures ? 1 : 0);
