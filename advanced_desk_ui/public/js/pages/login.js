/**
 * Advanced Desk UI — Login Page
 *
 * Frappe's login page (`/login`) already handles the actual auth form
 * (username/password, remember me, forgot password, OAuth buttons) — this
 * file only adds presentation: an animated gradient background, a
 * dark-mode toggle, and a language selector wired to the same endpoints
 * the Desk uses. The form fields and submit logic are untouched.
 */

(function () {
	function injectBackground() {
		if ($(".adu-login-bg").length) return;
		$("body").prepend(`<div class="adu-login-bg"><div class="adu-login-bg-blob adu-blob-1"></div><div class="adu-login-bg-blob adu-blob-2"></div></div>`);
	}

	function injectThemeToggle() {
		if ($(".adu-login-theme-toggle").length) return;
		const stored = (() => {
			try {
				return localStorage.getItem("adu:theme") || "Light";
			} catch (e) {
				return "Light";
			}
		})();
		document.documentElement.setAttribute("data-theme", stored === "Dark" ? "dark" : "light");

		const $toggle = $(`
			<button class="adu-login-theme-toggle" title="${__("Toggle theme")}">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
			</button>
		`);
		$toggle.on("click", () => {
			const isDark = document.documentElement.getAttribute("data-theme") === "dark";
			const next = isDark ? "light" : "dark";
			document.documentElement.setAttribute("data-theme", next);
			try {
				localStorage.setItem("adu:theme", next === "dark" ? "Dark" : "Light");
			} catch (e) {
				/* noop */
			}
		});
		$("body").append($toggle);
	}

	function injectLanguageSelector() {
		if ($(".adu-login-lang-select").length) return;
		if (!frappe.boot || !frappe.boot.lang) return;

		// Reuses the same language list Desk's own switcher uses (frappe.boot.__languages
		// when present); falls back to a short common set so the control still renders.
		const languages = (frappe.boot.__languages && frappe.boot.__languages.length)
			? frappe.boot.__languages
			: [
					{ value: "en", label: "English" },
					{ value: "fr", label: "Français" },
					{ value: "ar", label: "العربية" },
					{ value: "es", label: "Español" },
			  ];

		const $select = $(`
			<select class="adu-login-lang-select">
				${languages.map((l) => `<option value="${l.value}" ${l.value === frappe.boot.lang ? "selected" : ""}>${l.label}</option>`).join("")}
			</select>
		`);
		$select.on("change", function () {
			const url = new URL(window.location.href);
			url.searchParams.set("_lang", $(this).val());
			window.location.href = url.toString();
		});
		$("body").append($select);
	}

	function brandLoginCard() {
		const $card = $(".login-content, .for-login").first();
		if (!$card.length || $card.find(".adu-login-illustration").length) return;
		$card.addClass("adu-page-transition");
		$card.prepend(`
			<div class="adu-login-illustration">
				<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<rect x="3" y="4" width="18" height="14" rx="2"/>
					<path d="M3 9h18M8 4v14"/>
				</svg>
			</div>
		`);
	}

	function init() {
		injectBackground();
		injectThemeToggle();
		injectLanguageSelector();
		brandLoginCard();
	}

	$(document).ready(init);
})();
