/**
 * Advanced Desk UI — User Preferences Panel
 *
 * A single dialog covering the "User Preferences" section of the spec:
 * theme, density, sidebar width, animations, language. Reads/writes via
 * api/preferences.py so state is consistent with whatever the navbar
 * theme toggle or sidebar resize handle already set.
 */

frappe.provide("advanced_desk_ui");

advanced_desk_ui.preferences = (function () {
	function open() {
		frappe.call({
			method: "advanced_desk_ui.api.preferences.get_preferences",
			callback: (r) => showDialog(r.message || {}),
		});
	}

	function showDialog(current) {
		const dialog = new frappe.ui.Dialog({
			title: __("Desk Preferences"),
			fields: [
				{
					fieldtype: "Select",
					fieldname: "theme_mode",
					label: __("Theme"),
					options: "Light\nDark\nAuto",
					default: current.theme_mode,
				},
				{
					fieldtype: "Select",
					fieldname: "density",
					label: __("Density"),
					options: "comfortable\ncompact",
					default: current.density,
				},
				{
					fieldtype: "Int",
					fieldname: "sidebar_width",
					label: __("Sidebar Width (px)"),
					default: current.sidebar_width,
					description: __("Between 220 and 420px"),
				},
				{
					fieldtype: "Check",
					fieldname: "animations_enabled",
					label: __("Enable Animations"),
					default: current.animations_enabled ? 1 : 0,
				},
				{
					fieldtype: "Select",
					fieldname: "language",
					label: __("Language"),
					options: (frappe.boot.__languages || [{ value: "en", label: "English" }])
						.map((l) => l.value)
						.join("\n"),
					default: current.language,
				},
			],
			primary_action_label: __("Save"),
			primary_action(values) {
				const width = Math.min(420, Math.max(220, frappe.utils.cint(values.sidebar_width) || 268));
				frappe.call({
					method: "advanced_desk_ui.api.preferences.save_preferences",
					args: {
						theme_mode: values.theme_mode,
						density: values.density,
						sidebar_width: width,
						animations_enabled: values.animations_enabled ? 1 : 0,
						language: values.language,
					},
					callback: () => {
						applyLocally(values.theme_mode, values.density, width, values.animations_enabled);
						frappe.show_alert({ message: __("Preferences saved"), indicator: "green" }, 2);
						dialog.hide();
						if (values.language && values.language !== frappe.boot.lang) {
							frappe.show_alert({ message: __("Reloading for language change..."), indicator: "blue" }, 2);
							setTimeout(() => location.reload(), 800);
						}
					},
				});
			},
		});
		dialog.show();
	}

	function applyLocally(themeMode, density, sidebarWidth, animationsEnabled) {
		advanced_desk_ui.theme.setMode(themeMode);
		document.documentElement.setAttribute("data-density", density);
		document.documentElement.setAttribute("data-animations", animationsEnabled ? "" : "off");
		if (!animationsEnabled) document.documentElement.removeAttribute("data-animations-off-noop");
		document.documentElement.style.setProperty("--sidebar-width", sidebarWidth + "px");
		try {
			localStorage.setItem("adu:sidebar:width", sidebarWidth);
		} catch (e) {
			/* noop */
		}
	}

	function injectMenuItem() {
		const $userMenu = $(".navbar .dropdown-menu[aria-labelledby], .navbar-user .dropdown-menu").first();
		if (!$userMenu.length || $userMenu.find(".adu-preferences-menu-item").length) return;
		const $item = $(`<a class="dropdown-item adu-preferences-menu-item" href="#">${__("Desk Preferences")}</a>`);
		$item.on("click", (e) => {
			e.preventDefault();
			open();
		});
		$userMenu.prepend($item);
	}

	function init() {
		injectMenuItem();
		// Also reachable from the command palette for keyboard-first users.
	}

	return { init, open };
})();

$(document).on("app_ready", function () {
	advanced_desk_ui.preferences.init();
});
