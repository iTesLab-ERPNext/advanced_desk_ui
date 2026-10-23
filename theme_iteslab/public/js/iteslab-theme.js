// Core: paint the saved palette, track appearance, flag the current route.
//
// The payload arrives inside frappe.boot (extend_bootinfo hook), so the
// variables are written during the first frame — no fetch, no flash.

const iteslab = window.iteslab;

const STYLE_ID = "iteslab-theme-vars";

iteslab.theme = {
	payload: null,

	/** Read the boot payload and apply everything it describes. */
	init() {
		// Which shell we are in decides which selectors exist at all, so this
		// is settled before anything is painted or mounted.
		iteslab.compat.detect();

		const payload = (frappe.boot && frappe.boot.iteslab_theme) || null;
		this.apply(payload);

		// Live updates when an administrator saves Theme Settings.
		if (frappe.realtime && frappe.realtime.on) {
			frappe.realtime.on("iteslab_theme_updated", (updated) => {
				this.apply(updated);
				frappe.show_alert({ message: __("Theme updated"), indicator: "blue" });
			});
		}

		iteslab.bindRouting();
		iteslab.onRoute(() => this.flagRoute());
		iteslab._booted = true;
	},

	apply(payload) {
		if (!payload || !payload.enabled) {
			iteslab.ROOT.classList.remove("iteslab-enabled", "iteslab-zebra", "iteslab-table-sticky", "iteslab-table-upper");
			for (const option of ["all", "horizontal", "none"]) {
				iteslab.ROOT.classList.remove(`iteslab-table-borders-${option}`);
			}
			const existing = document.getElementById(STYLE_ID);
			if (existing) existing.remove();
			return;
		}

		this.payload = payload;
		iteslab.ROOT.classList.add("iteslab-enabled");
		iteslab.ROOT.dataset.iteslabDensity = (payload.density || "Comfortable").toLowerCase();
		iteslab.ROOT.classList.toggle("iteslab-zebra", !!payload.zebra_tables);
		this.applyTableFlags(payload);
		this.writeVariables(payload);
		this.applyDefaultAppearance(payload.appearance);
	},

	/**
	 * The three table settings that are not a single value: border style is
	 * three mutually exclusive rule sets, sticky and uppercase are switches.
	 * See the class list in iteslab-lists.bundle.css.
	 */
	applyTableFlags(payload) {
		const style = payload.table_border_style || "horizontal";

		for (const option of ["all", "horizontal", "none"]) {
			iteslab.ROOT.classList.toggle(`iteslab-table-borders-${option}`, option === style);
		}

		iteslab.ROOT.classList.toggle("iteslab-table-sticky", !!payload.table_sticky_header);
		iteslab.ROOT.classList.toggle("iteslab-table-upper", !!payload.table_header_uppercase);
	},

	writeVariables(payload) {
		const blocks = [
			[":root", payload.shared_vars],
			// Light values are scoped so they never fight the dark block.
			[':root:not([data-theme="dark"])', payload.vars],
			['[data-theme="dark"]', payload.dark_vars],
		];

		const css = blocks
			.filter(([, vars]) => vars && Object.keys(vars).length)
			.map(([selector, vars]) => {
				const body = Object.entries(vars)
					.map(([name, value]) => `\t${name}: ${value};`)
					.join("\n");
				return `${selector} {\n${body}\n}`;
			})
			.join("\n\n");

		let style = document.getElementById(STYLE_ID);
		if (!style) {
			style = document.createElement("style");
			style.id = STYLE_ID;
			document.head.appendChild(style);
		}
		style.textContent = css + (payload.custom_css ? `\n\n/* Custom CSS */\n${payload.custom_css}` : "");
	},

	/**
	 * Apply the configured default appearance the first time a user opens the
	 * Desk. Frappe stores the user's own choice; that always wins afterwards,
	 * and the native theme switcher in the user menu keeps working.
	 */
	applyDefaultAppearance(appearance) {
		if (!appearance || iteslab.storage.get("appearance-applied", false)) return;

		const target = { Light: "light", Dark: "dark", System: "automatic" }[appearance];
		if (!target) return;

		const userChoice = frappe.boot && frappe.boot.user && frappe.boot.user.desk_theme;
		if (userChoice) {
			iteslab.storage.set("appearance-applied", true);
			return;
		}

		if (frappe.ui && typeof frappe.ui.set_theme === "function") {
			frappe.ui.set_theme(target);
		} else {
			iteslab.ROOT.setAttribute("data-theme", target === "automatic" ? this.systemTheme() : target);
		}
		iteslab.storage.set("appearance-applied", true);
	},

	systemTheme() {
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	},

	/**
	 * Put the current view on <html> so CSS can target it without inspecting
	 * the URL. Frappe's own route is the source of truth.
	 */
	flagRoute() {
		const route = (frappe.get_route && frappe.get_route()) || [];
		const view = (route[0] || "workspace").toLowerCase();

		Array.from(iteslab.ROOT.classList)
			.filter((name) => name.startsWith("iteslab-route-"))
			.forEach((name) => iteslab.ROOT.classList.remove(name));

		iteslab.ROOT.classList.add(`iteslab-route-${view.replace(/[^a-z0-9-]/g, "-")}`);
	},
};

// Keep "System" honest when the OS flips while the Desk is open.
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
	if (iteslab.ROOT.getAttribute("data-theme-mode") === "automatic") {
		iteslab.ROOT.setAttribute("data-theme", event.matches ? "dark" : "light");
	}
});

iteslab.ready(() => iteslab.theme.init());

export default iteslab.theme;
