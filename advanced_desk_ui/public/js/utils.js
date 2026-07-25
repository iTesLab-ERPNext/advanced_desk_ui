/**
 * Advanced Desk UI — Shared Client Utils
 *
 * Small, dependency-free helpers used across bundles so debouncing and
 * lazy-loading logic isn't reimplemented per-component (DRY).
 */

frappe.provide("advanced_desk_ui");

advanced_desk_ui.utils = (function () {
	function debounce(fn, wait) {
		let t;
		return function (...args) {
			clearTimeout(t);
			t = setTimeout(() => fn.apply(this, args), wait);
		};
	}

	/**
	 * Lazily runs `callback` the first time `el` scrolls into view, then
	 * disconnects — used to defer expensive widget renders until visible
	 * (e.g. a dashboard widget below the fold).
	 */
	function lazyRun(el, callback) {
		if (!("IntersectionObserver" in window) || !el) {
			callback();
			return;
		}
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					callback();
					observer.disconnect();
				}
			});
		});
		observer.observe(el);
	}

	return { debounce, lazyRun };
})();
