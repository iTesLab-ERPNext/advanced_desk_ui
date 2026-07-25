/**
 * Advanced Desk UI — Theme Engine
 *
 * Responsibilities:
 *  - Resolve the effective theme (light / dark / auto→system) as early as
 *    possible to avoid a flash of unstyled/wrong theme.
 *  - Apply Advanced Desk Settings (admin, global) as CSS variables.
 *  - Apply the current user's overrides (per-user prefs) on top.
 *  - Persist user changes back to the server.
 *  - Expose a small pub/sub so other bundles (sidebar, navbar, widgets)
 *    can react to theme changes without a hard dependency on this file.
 */

frappe.provide("advanced_desk_ui");

advanced_desk_ui.theme = (function () {
	const STORAGE_KEY = "adu:theme"; // local fallback before boot info loads
	const STORAGE_PACK_KEY = "adu:theme:pack";
	const listeners = [];

	function systemPrefersDark() {
		return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
	}

	function resolveMode(mode) {
		if (mode === "Auto") return systemPrefersDark() ? "dark" : "light";
		return (mode || "Light").toLowerCase();
	}

	function applyCssVars(vars) {
		if (!vars) return;
		const root = document.documentElement;
		Object.keys(vars).forEach((key) => {
			if (vars[key]) root.style.setProperty(`--${key}`, vars[key]);
		});
	}

	function applyPack(pack) {
		const resolved = (pack || "Default").toLowerCase();
		document.documentElement.setAttribute("data-theme-pack", resolved);
		try {
			localStorage.setItem(STORAGE_PACK_KEY, pack || "Default");
		} catch (e) {
			/* noop */
		}
	}

	function applyTheme(mode, opts) {
		opts = opts || {};
		const resolved = resolveMode(mode);
		document.documentElement.setAttribute("data-theme", resolved);
		document.documentElement.setAttribute("data-theme-mode", mode || "Light");
		if (opts.density) document.documentElement.setAttribute("data-density", opts.density);
		if (opts.animations === false) {
			document.documentElement.setAttribute("data-animations", "off");
		} else {
			document.documentElement.removeAttribute("data-animations");
		}
		try {
			localStorage.setItem(STORAGE_KEY, mode || "Light");
		} catch (e) {
			/* storage may be unavailable, non-fatal */
		}
		listeners.forEach((fn) => fn(resolved, mode));
	}

	function init() {
		// 1. Instant paint from local cache (avoids flash before boot info)
		let cached = null;
		let cachedPack = null;
		try {
			cached = localStorage.getItem(STORAGE_KEY);
			cachedPack = localStorage.getItem(STORAGE_PACK_KEY);
		} catch (e) {
			/* ignore */
		}
		if (cached) applyTheme(cached);
		if (cachedPack) applyPack(cachedPack);

		// 2. Boot info: admin-level Advanced Desk Settings + this user's saved pref
		const boot = frappe.boot && frappe.boot.advanced_desk_ui;
		if (boot) {
			applyCssVars(boot.css_vars);
			applyTheme(boot.user_theme || boot.default_theme || "Light", {
				density: boot.density,
				animations: boot.animations_enabled,
			});
			applyPack(boot.theme_pack || "Default");
		}

		// 3. Track OS-level changes when mode is Auto
		if (window.matchMedia) {
			window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
				const currentMode = document.documentElement.getAttribute("data-theme-mode");
				if (currentMode === "Auto") applyTheme("Auto");
			});
		}
	}

	function setMode(mode) {
		applyTheme(mode);
		frappe.call({
			method: "advanced_desk_ui.api.preferences.set_theme_mode",
			args: { mode },
			callback: () => {
				frappe.show_alert({ message: __("Theme updated"), indicator: "green" }, 2);
			},
		});
	}

	function setPack(pack) {
		applyPack(pack);
		listeners.forEach((fn) => fn(resolveMode(document.documentElement.getAttribute("data-theme-mode")), null, pack));
	}

	function onChange(fn) {
		listeners.push(fn);
	}

	return { init, setMode, setPack, onChange, applyCssVars };
})();

$(document).on("app_ready", function () {
	advanced_desk_ui.theme.init();
});
