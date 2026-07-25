/**
 * Advanced Desk UI — Desk Overrides
 *
 * Small, additive glue that doesn't warrant its own bundle:
 *  - Page transition fade on route change
 *  - Feather icon replacement after any dynamic render
 */

frappe.provide("advanced_desk_ui");

(function () {
	function fadeInPage() {
		const $page = $(".page-container .page-body, .desk-page").first();
		if (!$page.length) return;
		$page.removeClass("adu-page-transition");
		// eslint-disable-next-line no-unused-expressions
		$page[0].offsetWidth; // force reflow so the animation replays
		$page.addClass("adu-page-transition");
	}

	function replaceFeatherIcons() {
		if (window.feather) window.feather.replace();
	}

	frappe.router && frappe.router.on && frappe.router.on("change", () => {
		fadeInPage();
		setTimeout(replaceFeatherIcons, 100);
	});

	$(document).on("app_ready", function () {
		fadeInPage();
		replaceFeatherIcons();
	});
})();
