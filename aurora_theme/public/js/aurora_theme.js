/**
 * Aurora Theme — Desk JS
 *
 * IMPORTANT: this app does NOT render its own sidebar. It only toggles and
 * restyles ERPNext's real sidebar DOM (see aurora_theme.css for the
 * `.desk-sidebar-container` / `.sidebar-item-container` rules). There is
 * exactly one menu — the one ERPNext already builds, permission-checked
 * and routed by core — this file just controls its visibility and adds
 * animated icons on top of it.
 *
 * What this file does:
 *   - Toggles `.aurora-sidebar-open` on <body>, which CSS uses to show
 *     the (otherwise width:0, hidden-by-default) real sidebar.
 *   - Injects an <iconify-icon> in front of each real sidebar item whose
 *     workspace has an `aurora_animated_icon` set (from
 *     events.sidebar.get_sidebar_pages), without touching anything else
 *     about how that item works.
 *   - Applies Theme Settings colors/fonts as CSS variables.
 *   - Dark mode toggle.
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

// Toggles ERPNext's OWN sidebar via a body class — no sidebar DOM is
// created here, this only flips visibility of what core already rendered.
aurora_theme.toggleSidebar = function () {
	document.body.classList.toggle("aurora-sidebar-open");
};

aurora_theme.closeSidebar = function () {
	document.body.classList.remove("aurora-sidebar-open");
};

function buildNavbar() {
	if (document.querySelector(".aurora-navbar-injected")) return;
	const $stockNavbar = $(".navbar").first();
	if (!$stockNavbar.length) return;
	$stockNavbar.addClass("aurora-navbar-injected");

	const $sidebarToggle = $(`
		<li class="nav-item aurora-sidebar-toggle" title="${__("Toggle sidebar")}" style="cursor:pointer;display:flex;align-items:center;padding:0 8px">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
		</li>
	`);
	$sidebarToggle.on("click", aurora_theme.toggleSidebar);
	$stockNavbar.find(".navbar-nav").first().prepend($sidebarToggle);

	const $darkToggle = $(`
		<li class="nav-item aurora-dark-toggle" title="${__("Toggle dark mode")}" style="cursor:pointer;display:flex;align-items:center;padding:0 8px">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
		</li>
	`);
	$darkToggle.on("click", aurora_theme.toggleDarkMode);
	$stockNavbar.find(".navbar-nav").first().prepend($darkToggle);
}

/**
 * Finds each real sidebar item for a workspace and, if that workspace has
 * an animated icon set, prepends an <iconify-icon> to its existing icon
 * slot — the item, link, and click handler are all still core's, this
 * only adds a visual. Matching is defensive (a couple of fallback
 * strategies) since the exact attribute Frappe puts on the item wrapper
 * has varied slightly across recent point releases; if none of these
 * match on your version, the icons just won't appear — nothing else here
 * depends on the match succeeding.
 */
function findSidebarItemContainer(page) {
	let $container = $(`.sidebar-item-container[item-name="${page.name}"]`);
	if ($container.length) return $container;

	$container = $(`.sidebar-item-container[item-name="${page.title}"]`);
	if ($container.length) return $container;

	// Fallback: match by visible label text
	const label = (page.title || page.name || "").trim();
	$(".sidebar-item-label").each(function () {
		if ($(this).text().trim() === label) {
			$container = $(this).closest(".sidebar-item-container");
			return false;
		}
	});
	if ($container && $container.length) return $container;

	// Fallback: match by link href containing the workspace's slug
	const slug = (page.title || page.name || "").toLowerCase().replace(/ /g, "-");
	return $(`.sidebar-item-container a[href*="${slug}"]`).closest(".sidebar-item-container");
}

function applyAnimatedIcons(pages) {
	function walk(list) {
		list.forEach((page) => {
			if (page.animated_icon) {
				const $container = findSidebarItemContainer(page);
				const $iconSlot = $container.find(".sidebar-item-icon").first();
				if ($iconSlot.length && !$iconSlot.find("iconify-icon").length) {
					$iconSlot.prepend(`<iconify-icon icon="${page.animated_icon}" style="font-size:16px"></iconify-icon>`);
				}
			}
			if (page.children && page.children.length) walk(page.children);
		});
	}
	walk(pages || []);
}

function loadAnimatedIcons() {
	frappe.call({
		method: "aurora_theme.events.sidebar.get_sidebar_pages",
		callback: (r) => applyAnimatedIcons(r.message || []),
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
		loadAnimatedIcons();
	});

	// Re-check for newly rendered sidebar items after each route change
	// (workspace switches can re-render the sidebar item list).
	frappe.router && frappe.router.on && frappe.router.on("change", () => setTimeout(loadAnimatedIcons, 300));

	$(document).on("keydown", function (e) {
		if (e.key === "Escape") aurora_theme.closeSidebar();
	});
})();
