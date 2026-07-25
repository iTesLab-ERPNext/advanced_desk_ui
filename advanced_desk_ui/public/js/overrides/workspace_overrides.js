/**
 * Advanced Desk UI — Workspace Redesign
 *
 * Adds a grid/list view toggle and gradient icon backgrounds to the
 * existing workspace shortcut cards Frappe already renders. Purely
 * additive DOM/class manipulation + CSS — the underlying shortcut
 * links, permissions, and click handlers are all untouched core code.
 */

frappe.provide("advanced_desk_ui");

advanced_desk_ui.workspaceOverrides = (function () {
	const LS_VIEW = "adu:workspace:view"; // "grid" | "list"
	const GRADIENTS = [
		"linear-gradient(135deg,#6366f1,#8b5cf6)",
		"linear-gradient(135deg,#06b6d4,#3b82f6)",
		"linear-gradient(135deg,#f59e0b,#ef4444)",
		"linear-gradient(135deg,#10b981,#06b6d4)",
		"linear-gradient(135deg,#ec4899,#8b5cf6)",
		"linear-gradient(135deg,#f97316,#f59e0b)",
	];

	function gradientFor(seed) {
		let hash = 0;
		for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
		return GRADIENTS[hash % GRADIENTS.length];
	}

	function applyGradients() {
		document.querySelectorAll(".widget-shortcut .shortcut-icon, .workspace-sidebar-item .sidebar-item-icon").forEach((iconEl) => {
			if (iconEl.dataset.aduGradient) return;
			iconEl.dataset.aduGradient = "1";
			const label = iconEl.closest("[data-label]")?.getAttribute("data-label") || iconEl.textContent || "x";
			iconEl.style.background = gradientFor(label);
			iconEl.classList.add("adu-gradient-icon");
		});
	}

	function injectViewToggle() {
		const $shortcutsContainer = $(".workspace-shortcuts, .shortcut-widget-box").first();
		if (!$shortcutsContainer.length || $(".adu-view-toggle").length) return;

		let view = "grid";
		try {
			view = localStorage.getItem(LS_VIEW) || "grid";
		} catch (e) {
			/* noop */
		}

		const $toggle = $(`
			<div class="adu-view-toggle">
				<button data-view="grid" class="${view === "grid" ? "active" : ""}" title="${__("Grid view")}">▦</button>
				<button data-view="list" class="${view === "list" ? "active" : ""}" title="${__("List view")}">☰</button>
			</div>
		`);
		$shortcutsContainer.before($toggle);
		applyView(view);

		$toggle.on("click", "button", function () {
			const newView = $(this).attr("data-view");
			$toggle.find("button").removeClass("active");
			$(this).addClass("active");
			try {
				localStorage.setItem(LS_VIEW, newView);
			} catch (e) {
				/* noop */
			}
			applyView(newView);
		});
	}

	function applyView(view) {
		$(".workspace-shortcuts, .shortcut-widget-box").toggleClass("adu-list-view", view === "list");
	}

	function init() {
		frappe.router.on("change", schedule);
		schedule();
	}

	function schedule() {
		// Workspace DOM renders async; a short delay is simpler and more
		// robust across Frappe versions than hooking every internal render event.
		setTimeout(() => {
			applyGradients();
			injectViewToggle();
		}, 200);
	}

	return { init };
})();

$(document).on("app_ready", function () {
	advanced_desk_ui.workspaceOverrides.init();
});
