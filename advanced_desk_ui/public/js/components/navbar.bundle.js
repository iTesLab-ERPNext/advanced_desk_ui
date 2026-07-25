/**
 * Advanced Desk UI — Navbar
 *
 * Frappe's stock navbar already provides Global Search trigger, Quick
 * Create ("+ New"), Notifications, Messages, and the Apps launcher — so
 * instead of rebuilding those from scratch (duplicated logic, risk of
 * drifting from core permission checks), this bundle *augments* the
 * existing `.navbar` with the pieces the spec asks for that core doesn't
 * have: a theme toggle, a company switcher, and a fullscreen button.
 * Visual restyling of the untouched elements happens purely in CSS
 * (theme.scss / _navbar.scss).
 */

frappe.provide("advanced_desk_ui");

advanced_desk_ui.navbar = (function () {
	function injectThemeToggle($navbar) {
		if ($navbar.find(".adu-theme-toggle").length) return;

		const $toggle = $(`
			<li class="nav-item dropdown adu-theme-toggle" title="${__("Toggle theme")}">
				<a class="nav-link" href="#" data-toggle="dropdown">
					<span class="adu-theme-icon-light">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
					</span>
					<span class="adu-theme-icon-dark">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
					</span>
				</a>
				<div class="dropdown-menu dropdown-menu-right adu-theme-menu">
					<a class="dropdown-item" data-mode="Light">${__("Light")}</a>
					<a class="dropdown-item" data-mode="Dark">${__("Dark")}</a>
					<a class="dropdown-item" data-mode="Auto">${__("Auto")}</a>
				</div>
			</li>
		`);

		$toggle.on("click", ".dropdown-item", function () {
			advanced_desk_ui.theme.setMode($(this).attr("data-mode"));
			markActiveMode($toggle);
		});

		// Insert before the notifications icon if present, else append
		const $anchor = $navbar.find(".navbar-nav.notifications-icon, .navbar-nav").first();
		$anchor.length ? $toggle.insertBefore($anchor.find("> li").first()) : $navbar.find(".navbar-nav").append($toggle);

		markActiveMode($toggle);
	}

	function markActiveMode($toggle) {
		const mode = document.documentElement.getAttribute("data-theme-mode") || "Light";
		$toggle.find(".dropdown-item").removeClass("active");
		$toggle.find(`.dropdown-item[data-mode="${mode}"]`).addClass("active");
	}

	function injectFullscreenToggle($navbar) {
		if ($navbar.find(".adu-fullscreen-toggle").length) return;
		const $btn = $(`
			<li class="nav-item adu-fullscreen-toggle" title="${__("Toggle fullscreen")}">
				<a class="nav-link" href="#">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
				</a>
			</li>
		`);
		$btn.on("click", () => {
			if (!document.fullscreenElement) {
				document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
			} else {
				document.exitFullscreen && document.exitFullscreen();
			}
		});
		$navbar.find(".navbar-nav").first().append($btn);
	}

	function injectCompanySwitcher($navbar) {
		// Only relevant to multi-company installs; skip silently otherwise.
		const companies = (frappe.boot.sysdefaults && frappe.boot.sysdefaults.company) ? null : null;
		if (!frappe.boot.user || !frappe.defaults) return;
		frappe.db
			.get_list("Company", { fields: ["name"], limit_page_length: 0 })
			.then((rows) => {
				if (!rows || rows.length < 2) return; // single-company: nothing to switch
				if ($navbar.find(".adu-company-switcher").length) return;

				const current = frappe.defaults.get_default("company") || rows[0].name;
				const $switcher = $(`
					<li class="nav-item dropdown adu-company-switcher" title="${__("Switch company")}">
						<a class="nav-link" href="#" data-toggle="dropdown">${frappe.utils.escape_html(current)}</a>
						<div class="dropdown-menu dropdown-menu-right">
							${rows.map((c) => `<a class="dropdown-item" data-company="${frappe.utils.escape_html(c.name)}">${frappe.utils.escape_html(c.name)}</a>`).join("")}
						</div>
					</li>
				`);
				$switcher.on("click", ".dropdown-item", function () {
					const company = $(this).attr("data-company");
					frappe.defaults.set_default("company", company);
					$switcher.find(".nav-link").text(company);
					frappe.show_alert({ message: __("Switched to {0}", [company]), indicator: "green" });
				});
				$navbar.find(".navbar-nav").first().prepend($switcher);
			})
			.catch(() => {
				/* Company doctype may not exist yet on a fresh site — ignore */
			});
	}

	function injectMobileToggle($navbar) {
		if ($navbar.find(".adu-mobile-sidebar-toggle").length) return;
		const $btn = $(`
			<li class="nav-item adu-mobile-sidebar-toggle" title="${__("Menu")}">
				<a class="nav-link" href="#">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
				</a>
			</li>
		`);
		$btn.on("click", () => $("#adu-sidebar").toggleClass("adu-mobile-open"));
		$navbar.find(".navbar-nav").first().prepend($btn);

		// Swipe-to-close on touch devices
		let touchStartX = null;
		$(document).on("touchstart", "#adu-sidebar", (e) => {
			touchStartX = e.originalEvent.touches[0].clientX;
		});
		$(document).on("touchend", "#adu-sidebar", (e) => {
			if (touchStartX === null) return;
			const dx = e.originalEvent.changedTouches[0].clientX - touchStartX;
			if (dx < -50) $("#adu-sidebar").removeClass("adu-mobile-open");
			touchStartX = null;
		});
	}

	function init() {
		const $navbar = $(".navbar").first();
		if (!$navbar.length) return;
		injectThemeToggle($navbar);
		injectFullscreenToggle($navbar);
		injectCompanySwitcher($navbar);
		injectMobileToggle($navbar);

		advanced_desk_ui.theme.onChange(() => markActiveMode($navbar.find(".adu-theme-toggle")));
	}

	return { init };
})();

$(document).on("app_ready", function () {
	advanced_desk_ui.navbar.init();
});
