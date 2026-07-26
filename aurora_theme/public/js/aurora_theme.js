/**
 * Aurora Theme — Desk JS
 *
 * Builds a custom sidebar + navbar as an overlay on top of the stock Desk
 * DOM (same additive technique used throughout this theme family: nothing
 * here replaces core templates or routing, so workspace permissions and
 * navigation keep working exactly as ERPNext built them). Two things it
 * adds that core doesn't have:
 *   - Animated Iconify icons per workspace (from the `aurora_animated_icon`
 *     custom field, resolved server-side by events.sidebar.get_sidebar_pages)
 *   - Theme Settings-driven colors/fonts, dark mode, and a mobile drawer
 */

frappe.provide("aurora_theme");

aurora_theme.applySettings = function (settings) {
	if (!settings) return;
	const root = document.documentElement;
	if (settings.primary_color) root.style.setProperty("--aurora-primary", settings.primary_color);
	if (settings.secondary_color) root.style.setProperty("--aurora-secondary", settings.secondary_color);
	if (settings.accent_color) root.style.setProperty("--aurora-accent", settings.accent_color);
	if (settings.heading_font) root.style.setProperty("--aurora-font-heading", `"${settings.heading_font}", "Inter", sans-serif`);
	if (settings.body_font) root.style.setProperty("--aurora-font-body", `"${settings.body_font}", sans-serif`);
};

aurora_theme.toggleDarkMode = function () {
	const isDark = document.documentElement.getAttribute("data-aurora-theme") === "dark";
	const next = isDark ? "light" : "dark";
	document.documentElement.setAttribute("data-aurora-theme", next);
	try {
		localStorage.setItem("aurora:theme", next);
	} catch (e) {
		/* noop */
	}
};

aurora_theme.toggleSidebar = function () {
	document.querySelector(".aurora-sidebar")?.classList.toggle("aurora-open");
	document.querySelector(".aurora-sidebar-backdrop")?.classList.toggle("aurora-open");
};

aurora_theme.closeSidebar = function () {
	document.querySelector(".aurora-sidebar")?.classList.remove("aurora-open");
	document.querySelector(".aurora-sidebar-backdrop")?.classList.remove("aurora-open");
};

function iconTag(code) {
	return code ? `<iconify-icon icon="${code}" class="aurora-nav-icon"></iconify-icon>` : `<span class="aurora-nav-icon">•</span>`;
}

function renderNavItem(page, depth) {
	const route = "/app/" + encodeURIComponent((page.title || page.name || "").toLowerCase().replace(/ /g, "-"));
	const children = page.children || [];
	return `
		<a href="${route}" class="aurora-nav-item" data-label="${(page.title || "").toLowerCase()}" style="margin-left:${depth * 8}px">
			${iconTag(page.animated_icon)}
			<span>${frappe.utils.escape_html(page.title || page.name)}</span>
		</a>
		${children.length ? `<div class="aurora-nav-children">${children.map((c) => renderNavItem(c, 0)).join("")}</div>` : ""}
	`;
}

function buildSidebar(pages) {
	if (document.querySelector(".aurora-sidebar")) return;

	const boot = frappe.boot && frappe.boot.aurora_theme;
	const $backdrop = $(`<div class="aurora-sidebar-backdrop"></div>`);
	const $sidebar = $(`
		<div class="aurora-sidebar">
			<div class="aurora-sidebar-header">
				${boot && boot.sidebar_logo ? `<img src="${boot.sidebar_logo}" />` : ""}
				<span class="aurora-sidebar-title">${frappe.utils.escape_html((boot && boot.sidebar_text) || "Aurora")}</span>
			</div>
			<div class="aurora-sidebar-search">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
				<input type="text" placeholder="${__("Search workspaces...")}" />
			</div>
			<div class="aurora-sidebar-nav">
				${pages.map((p) => renderNavItem(p, 0)).join("")}
			</div>
		</div>
	`);
	// Sidebar starts closed (see .aurora-sidebar default transform in CSS) —
	// opened only via the navbar toggle, never automatically.
	$("body").append($backdrop).append($sidebar);

	$backdrop.on("click", aurora_theme.closeSidebar);
	$sidebar.on("click", ".aurora-nav-item", aurora_theme.closeSidebar);

	$sidebar.find("input").on("input", function () {
		const q = $(this).val().toLowerCase();
		$sidebar.find(".aurora-nav-item").each(function () {
			const label = $(this).attr("data-label") || "";
			$(this).toggle(!q || label.includes(q));
		});
	});
}

function buildNavbar() {
	if (document.querySelector(".aurora-navbar-injected")) return;
	const $stockNavbar = $(".navbar").first();
	if (!$stockNavbar.length) return;
	$stockNavbar.addClass("aurora-navbar aurora-navbar-injected");

	const $darkToggle = $(`
		<li class="nav-item aurora-dark-toggle" title="${__("Toggle dark mode")}" style="cursor:pointer;display:flex;align-items:center;padding:0 8px">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
		</li>
	`);
	$darkToggle.on("click", aurora_theme.toggleDarkMode);
	$stockNavbar.find(".navbar-nav").first().prepend($darkToggle);

	const $sidebarToggle = $(`
		<li class="nav-item aurora-sidebar-toggle" title="${__("Toggle sidebar")}" style="cursor:pointer;display:flex;align-items:center;padding:0 8px">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
		</li>
	`);
	$sidebarToggle.on("click", aurora_theme.toggleSidebar);
	$stockNavbar.find(".navbar-nav").first().prepend($sidebarToggle);
}

function loadSidebarData() {
	frappe.call({
		method: "aurora_theme.events.sidebar.get_sidebar_pages",
		callback: (r) => buildSidebar(r.message || []),
	});
}

(function init() {
	try {
		const cachedMode = localStorage.getItem("aurora:theme");
		if (cachedMode) document.documentElement.setAttribute("data-aurora-theme", cachedMode);
	} catch (e) {
		/* noop */
	}

	$(document).on("app_ready", function () {
		aurora_theme.applySettings(frappe.boot && frappe.boot.aurora_theme);
		buildNavbar();
		loadSidebarData();
	});

	$(document).on("keydown", function (e) {
		if (e.key === "Escape") aurora_theme.closeSidebar();
	});
})();
