/**
 * Advanced Desk UI — Command Palette (Ctrl+K)
 *
 * A VSCode-style overlay for two kinds of actions:
 *   1. Static commands (create doc, open report, switch company, toggle
 *      theme, logout, navigate to a doctype list) — matched client-side.
 *   2. Live search-as-you-type against api/sidebar.search_sidebar for
 *      workspaces/reports/doctypes, reusing the same permission-aware
 *      endpoint the sidebar search box uses (single source of truth).
 */

frappe.provide("advanced_desk_ui");

advanced_desk_ui.commandPalette = (function () {
	let $overlay, $input, $results, open = false, activeIndex = 0;

	const STATIC_COMMANDS = [
		{
			label: __("Create New Document..."),
			icon: "plus",
			action: () => frappe.new_doc(),
		},
		{
			label: __("Toggle Theme"),
			icon: "moon",
			action: () => {
				const modes = ["Light", "Dark", "Auto"];
				const current = document.documentElement.getAttribute("data-theme-mode") || "Light";
				const next = modes[(modes.indexOf(current) + 1) % modes.length];
				advanced_desk_ui.theme.setMode(next);
			},
		},
		{
			label: __("Toggle Sidebar"),
			icon: "sidebar",
			action: () => advanced_desk_ui.sidebar.toggleCollapsed(),
		},
		{
			label: __("Open Desk Preferences..."),
			icon: "settings",
			action: () => advanced_desk_ui.preferences.open(),
		},
		{
			label: __("Go to Workspace..."),
			icon: "grid",
			action: () => frappe.set_route("app"),
		},
		{
			label: __("Log Out"),
			icon: "log-out",
			action: () => frappe.app.logout(),
		},
	];

	function build() {
		if ($overlay) return;
		$overlay = $(`
			<div class="adu-command-palette-overlay">
				<div class="adu-command-palette">
					<div class="adu-cp-input-row">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
						<input type="text" placeholder="${__("Type a command or search...")}" />
						<kbd>Esc</kbd>
					</div>
					<div class="adu-cp-results"></div>
				</div>
			</div>
		`);
		$("body").append($overlay);
		$input = $overlay.find("input");
		$results = $overlay.find(".adu-cp-results");

		$overlay.on("click", function (e) {
			if (e.target === $overlay[0]) close();
		});

		const debouncedServerSearch = advanced_desk_ui.utils.debounce((query) => runServerSearch(query), 180);
		$input.on("input", function () {
			activeIndex = 0;
			const query = $(this).val();
			renderStatic(query);
			if (query.length >= 2) debouncedServerSearch(query);
		});

		$input.on("keydown", function (e) {
			const $items = $results.find(".adu-cp-item");
			if (e.key === "ArrowDown") {
				e.preventDefault();
				activeIndex = Math.min(activeIndex + 1, $items.length - 1);
				highlight($items);
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				activeIndex = Math.max(activeIndex - 1, 0);
				highlight($items);
			} else if (e.key === "Enter") {
				e.preventDefault();
				$items.eq(activeIndex).trigger("click");
			} else if (e.key === "Escape") {
				close();
			}
		});

		$results.on("click", ".adu-cp-item", function () {
			const idx = $(this).attr("data-static-idx");
			if (idx !== undefined) {
				STATIC_COMMANDS[idx].action();
			} else {
				frappe.set_route($(this).attr("data-route"));
			}
			close();
		});
	}

	function highlight($items) {
		$items.removeClass("active");
		$items.eq(activeIndex).addClass("active");
	}

	function renderStatic(query) {
		const q = (query || "").toLowerCase();
		const matches = STATIC_COMMANDS.map((c, i) => ({ ...c, i })).filter((c) => !q || c.label.toLowerCase().includes(q));
		$results.html(
			matches
				.map(
					(c) => `
			<div class="adu-cp-item" data-static-idx="${c.i}">
				<i data-feather="${c.icon}" style="width:14px;height:14px"></i>
				<span>${c.label}</span>
			</div>`
				)
				.join("") || `<div class="adu-cp-empty">${__("No matching commands")}</div>`
		);
		if (window.feather) window.feather.replace();
		highlight($results.find(".adu-cp-item"));
	}

	function runServerSearch(query) {
		frappe.call({
			method: "advanced_desk_ui.api.sidebar.search_sidebar",
			args: { query },
			callback: (r) => {
				const { workspaces = [], reports = [], doctypes = [] } = r.message || {};
				const extra =
					workspaces
						.map(
							(w) => `
					<div class="adu-cp-item" data-route="/app/${encodeURIComponent(w.name.toLowerCase().replace(/ /g, "-"))}">
						<i data-feather="grid" style="width:14px;height:14px"></i>
						<span>${frappe.utils.escape_html(w.title)}</span>
						<span class="adu-cp-tag">${__("Workspace")}</span>
					</div>`
						)
						.join("") +
					reports
						.map(
							(r2) => `
					<div class="adu-cp-item" data-route="/app/query-report/${encodeURIComponent(r2.name)}">
						<i data-feather="bar-chart-2" style="width:14px;height:14px"></i>
						<span>${frappe.utils.escape_html(r2.report_name)}</span>
						<span class="adu-cp-tag">${__("Report")}</span>
					</div>`
						)
						.join("") +
					doctypes
						.map(
							(d) => `
					<div class="adu-cp-item" data-route="/app/${frappe.router.slug(d.name)}">
						<i data-feather="file-text" style="width:14px;height:14px"></i>
						<span>${frappe.utils.escape_html(d.name)}</span>
						<span class="adu-cp-tag">${__("DocType")}</span>
					</div>`
						)
						.join("");
				if (extra) $results.append(extra);
				if (window.feather) window.feather.replace();
			},
		});
	}

	function openPalette() {
		build();
		open = true;
		$overlay.addClass("adu-open");
		$input.val("").trigger("focus");
		renderStatic("");
	}

	function close() {
		if (!$overlay) return;
		open = false;
		$overlay.removeClass("adu-open");
	}

	function init() {
		$(document).on("keydown", function (e) {
			const ctrlOrCmd = e.ctrlKey || e.metaKey;
			if (ctrlOrCmd && e.key.toLowerCase() === "k") {
				e.preventDefault();
				open ? close() : openPalette();
			}
		});
	}

	return { init, open: openPalette, close };
})();

$(document).on("app_ready", function () {
	advanced_desk_ui.commandPalette.init();
});
