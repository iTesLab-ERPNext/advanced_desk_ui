/**
 * Advanced Desk UI — Dashboard Widgets
 *
 * Replaces the Desk Home page content with a widget grid. Layout (which
 * widgets, in what order/size) is fetched from api/dashboard.get_layout
 * and persisted per-user via api/dashboard.save_layout. Reordering uses
 * SortableJS (loaded from CDN per hooks.py); resizing is a simplified
 * "size" toggle (S/M/L) rather than free-form pixel dragging, which is
 * both easier to reason about accessibly and maps cleanly to a 12-col grid.
 *
 * Only fires on the Desk home route so it never interferes with normal
 * DocType/Report pages.
 */

frappe.provide("advanced_desk_ui");

advanced_desk_ui.dashboard = (function () {
	const WIDGET_META = {
		kpis: { title: __("KPIs"), render: renderKPIs },
		recent_documents: { title: __("Recent Documents"), render: renderRecentDocuments },
		pending_approvals: { title: __("Pending Approvals"), render: renderPendingApprovals },
		tasks: { title: __("Tasks"), render: renderTasks },
		projects: { title: __("Projects"), render: renderProjects },
		calendar: { title: __("Calendar"), render: renderCalendar },
		announcements: { title: __("Announcements"), render: renderAnnouncements },
		favorites_and_shortcuts: { title: __("Shortcuts"), render: renderShortcuts },
	};

	let $container, currentLayout = [];

	function isHomeRoute() {
		const route = frappe.get_route();
		return !route.length || (route[0] === "workspaces" && route.length === 1);
	}

	function mount() {
		if (!isHomeRoute()) return;
		const $target = $(".workspace-sidebar").length ? $(".layout-main-section") : $("#body_div");
		if (!$target.length || $target.find(".adu-dashboard-grid").length) return;

		$container = $(`
			<div class="adu-dashboard">
				<div class="adu-dashboard-toolbar">
					<h3>${__("Dashboard")}</h3>
					<button class="btn btn-sm btn-default adu-dashboard-reset">${__("Reset Layout")}</button>
				</div>
				<div class="adu-dashboard-grid"></div>
			</div>
		`);
		$target.prepend($container);

		$container.find(".adu-dashboard-reset").on("click", () => {
			frappe.call({
				method: "advanced_desk_ui.api.dashboard.save_layout",
				args: { layout: "[]" },
				callback: () => location.reload(),
			});
		});

		loadLayout();
	}

	function loadLayout() {
		frappe.call({
			method: "advanced_desk_ui.api.dashboard.get_layout",
			callback: (r) => {
				currentLayout = r.message || [];
				renderGrid();
			},
		});
	}

	function renderGrid() {
		const $grid = $container.find(".adu-dashboard-grid");
		$grid.empty();

		currentLayout.forEach((entry) => {
			const meta = WIDGET_META[entry.widget];
			if (!meta) return;
			const $card = $(`
				<div class="adu-widget-card adu-widget-size-${sizeClass(entry.w)}" data-widget="${entry.widget}">
					<div class="adu-widget-header">
						<span class="adu-widget-drag-handle">⠿</span>
						<span class="adu-widget-title">${meta.title}</span>
						<div class="adu-widget-size-controls">
							<button data-size="4">S</button>
							<button data-size="6">M</button>
							<button data-size="12">L</button>
						</div>
					</div>
					<div class="adu-widget-body"><div class="skeleton" style="height:80px"></div></div>
				</div>
			`);
			$grid.append($card);
			loadWidgetData(entry.widget, $card, meta);
		});

		bindResizeControls($grid);
		enableDragReorder($grid);
	}

	function sizeClass(w) {
		if (w <= 4) return "s";
		if (w <= 6) return "m";
		return "l";
	}

	function bindResizeControls($grid) {
		$grid.off("click", ".adu-widget-size-controls button").on("click", ".adu-widget-size-controls button", function () {
			const widget = $(this).closest(".adu-widget-card").attr("data-widget");
			const newW = parseInt($(this).attr("data-size"), 10);
			const entry = currentLayout.find((e) => e.widget === widget);
			if (entry) entry.w = newW;
			persistLayout();
			renderGrid();
		});
	}

	function enableDragReorder($grid) {
		if (!window.Sortable) return; // CDN blocked/offline — grid still works, just not reorderable
		if ($grid.data("adu-sortable-bound")) return;
		$grid.data("adu-sortable-bound", true);
		Sortable.create($grid[0], {
			handle: ".adu-widget-drag-handle",
			animation: 150,
			onEnd: () => {
				const order = $grid.find(".adu-widget-card").map((_, el) => $(el).attr("data-widget")).get();
				currentLayout.sort((a, b) => order.indexOf(a.widget) - order.indexOf(b.widget));
				persistLayout();
			},
		});
	}

	function persistLayout() {
		frappe.call({
			method: "advanced_desk_ui.api.dashboard.save_layout",
			args: { layout: JSON.stringify(currentLayout) },
		});
	}

	function loadWidgetData(widget, $card, meta) {
		frappe.call({
			method: "advanced_desk_ui.api.dashboard.get_widget_data",
			args: { widget },
			callback: (r) => {
				$card.find(".adu-widget-body").html(meta.render(r.message || []));
			},
			error: () => {
				$card.find(".adu-widget-body").html(`<div class="adu-widget-error">${__("Couldn't load this widget")}</div>`);
			},
		});
	}

	// --- Renderers (all defensive against empty data) ---
	function renderKPIs(data) {
		if (!data.length) return emptyState(__("No KPIs available"));
		return `<div class="adu-kpi-row">${data
			.map((k) => `<div class="adu-kpi"><div class="adu-kpi-value">${k.value}</div><div class="adu-kpi-label">${frappe.utils.escape_html(k.label)}</div></div>`)
			.join("")}</div>`;
	}
	function renderRecentDocuments(data) {
		if (!data.length) return emptyState(__("Nothing recent"));
		return listHtml(data.map((d) => ({ label: d.route, sub: frappe.datetime.comment_when(d.creation) })));
	}
	function renderPendingApprovals(data) {
		if (!data.length) return emptyState(__("No pending approvals"));
		return listHtml(data.map((d) => ({ label: d.description || d.reference_name, sub: d.date })));
	}
	function renderTasks(data) {
		if (!data.length) return emptyState(__("No open tasks"));
		return listHtml(data.map((d) => ({ label: d.subject, sub: d.status })));
	}
	function renderProjects(data) {
		if (!data.length) return emptyState(__("No open projects"));
		return listHtml(data.map((d) => ({ label: d.project_name || d.name, sub: `${d.percent_complete || 0}%` })));
	}
	function renderCalendar(data) {
		if (!data.length) return emptyState(__("Nothing scheduled this week"));
		return listHtml(data.map((d) => ({ label: d.subject, sub: frappe.datetime.str_to_user(d.starts_on) })));
	}
	function renderAnnouncements(data) {
		if (!data.length) return emptyState(__("No announcements"));
		return listHtml(data.map((d) => ({ label: d.subject, sub: frappe.datetime.comment_when(d.creation) })));
	}
	function renderShortcuts(data) {
		if (!data.length) return emptyState(__("Star items in the sidebar to see shortcuts here"));
		return `<div class="adu-shortcut-grid">${data
			.map((d) => `<div class="adu-shortcut" data-value="${frappe.utils.escape_html(d.item_value)}">${frappe.utils.escape_html(d.label || d.item_value)}</div>`)
			.join("")}</div>`;
	}

	function listHtml(rows) {
		return `<div class="adu-widget-list">${rows
			.map((r) => `<div class="adu-widget-list-row"><span>${frappe.utils.escape_html(r.label || "")}</span><span class="adu-widget-list-sub">${frappe.utils.escape_html(r.sub || "")}</span></div>`)
			.join("")}</div>`;
	}
	function emptyState(text) {
		return `<div class="adu-widget-empty">${text}</div>`;
	}

	function init() {
		frappe.router.on("change", () => setTimeout(mount, 50));
		mount();
	}

	return { init };
})();

$(document).on("app_ready", function () {
	advanced_desk_ui.dashboard.init();
});
