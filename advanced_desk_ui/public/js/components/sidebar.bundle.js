/**
 * Advanced Desk UI — Sidebar
 *
 * Renders an overlay sidebar shell (`#adu-sidebar`) alongside the stock
 * Frappe sidebar rather than replacing its DOM/routing — this keeps every
 * existing workspace link, permission check, and route working exactly as
 * ERPNext core built it, while giving us a fully custom look & extra
 * sections (Favorites / Recent / Search) that core doesn't have.
 *
 * Sections:
 *   - Search box (local filter + server search via api/sidebar.search_sidebar)
 *   - Favorites (workspaces / reports / doctypes user has pinned)
 *   - Recent (from Route History, via api/sidebar.get_recent)
 *   - Workspaces (mirrors frappe.boot.allowed_workspaces, nested by parent)
 *
 * State persisted client-side (collapsed/width) via localStorage for
 * instant restore.
 */

frappe.provide("advanced_desk_ui");

advanced_desk_ui.sidebar = (function () {
	const LS_COLLAPSED = "adu:sidebar:collapsed";
	const LS_WIDTH = "adu:sidebar:width";
	const MIN_WIDTH = 220;
	const MAX_WIDTH = 420;

	let $root, $searchInput, favoritesCache = {};

	function el(html) {
		return $(html);
	}

	function build() {
		if ($("#adu-sidebar").length) return; // already built (e.g. route change)

		$root = el(`
			<div id="adu-sidebar" class="adu-sidebar">
				<div class="adu-sidebar-header">
					<div class="adu-sidebar-search">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
						<input type="text" placeholder="${__("Search or jump to...")}" />
						<kbd>Ctrl K</kbd>
					</div>
					<button class="adu-sidebar-collapse-btn" title="${__("Collapse sidebar")}">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
					</button>
				</div>
				<div class="adu-sidebar-body">
					<div class="adu-sidebar-section" data-section="favorites">
						<div class="adu-sidebar-section-title">${__("Favorites")}</div>
						<div class="adu-sidebar-list adu-favorites-list"></div>
					</div>
					<div class="adu-sidebar-section" data-section="recent">
						<div class="adu-sidebar-section-title">${__("Recent")}</div>
						<div class="adu-sidebar-list adu-recent-list"></div>
					</div>
					<div class="adu-sidebar-section" data-section="workspaces">
						<div class="adu-sidebar-section-title">${__("Workspaces")}</div>
						<div class="adu-sidebar-list adu-workspaces-list"></div>
					</div>
				</div>
				<div class="adu-sidebar-resize-handle"></div>
			</div>
		`);
		$("body").addClass("adu-has-sidebar").prepend($root);

		$searchInput = $root.find(".adu-sidebar-search input");
		bindEvents();
		restoreState();
		renderWorkspaces();
		loadFavorites();
		loadRecent();
	}

	function bindEvents() {
		$root.find(".adu-sidebar-collapse-btn").on("click", toggleCollapsed);

		const debouncedSearch = advanced_desk_ui.utils.debounce((query) => runSearch(query), 200);
		$searchInput.on("input", function () {
			debouncedSearch($(this).val());
		});

		// Resize handle (drag to resize, clamped to MIN/MAX)
		const $handle = $root.find(".adu-sidebar-resize-handle");
		let dragging = false;
		$handle.on("mousedown", (e) => {
			dragging = true;
			e.preventDefault();
			document.body.style.cursor = "col-resize";
		});
		$(document).on("mousemove.adu-sidebar", (e) => {
			if (!dragging) return;
			const width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
			applyWidth(width);
		});
		$(document).on("mouseup.adu-sidebar", () => {
			if (!dragging) return;
			dragging = false;
			document.body.style.cursor = "";
			try {
				localStorage.setItem(LS_WIDTH, $root.width());
			} catch (e) {
				/* noop */
			}
		});

		// Delegate favorite-star clicks
		$root.on("click", ".adu-fav-toggle", function (e) {
			e.stopPropagation();
			e.preventDefault();
			const $item = $(this).closest("[data-item-type]");
			toggleFavorite(
				$item.attr("data-item-type"),
				$item.attr("data-item-value"),
				$item.attr("data-item-label"),
				$item.attr("data-item-icon")
			);
		});

		// Route highlighting
		$(document).on("app_ready", highlightActiveRoute);
		frappe.router && frappe.router.on && frappe.router.on("change", highlightActiveRoute);
	}

	function restoreState() {
		let collapsed = false;
		let width = 268;
		try {
			collapsed = localStorage.getItem(LS_COLLAPSED) === "1";
			width = parseInt(localStorage.getItem(LS_WIDTH), 10) || width;
		} catch (e) {
			/* noop */
		}
		if (collapsed) $root.addClass("collapsed");
		applyWidth(width);
	}

	function applyWidth(width) {
		document.documentElement.style.setProperty("--sidebar-width", width + "px");
	}

	function toggleCollapsed() {
		const collapsed = $root.toggleClass("collapsed").hasClass("collapsed");
		try {
			localStorage.setItem(LS_COLLAPSED, collapsed ? "1" : "0");
		} catch (e) {
			/* noop */
		}
	}

	// --- Workspaces (nested, from existing frappe.boot data — no re-fetch) ---
	function renderWorkspaces() {
		const $list = $root.find(".adu-workspaces-list");
		const workspaces = frappe.boot.allowed_workspaces || [];
		const byParent = {};
		workspaces.forEach((w) => {
			const parent = w.parent_page || "__root__";
			(byParent[parent] = byParent[parent] || []).push(w);
		});

		function renderLevel(parentKey, depth) {
			return (byParent[parentKey] || [])
				.sort((a, b) => (a.sequence_id || 0) - (b.sequence_id || 0))
				.map((w) => {
					const children = byParent[w.title] || [];
					const route = "/app/" + encodeURIComponent(w.title.toLowerCase().replace(/ /g, "-"));
					return `
						<div class="adu-sidebar-item" data-item-type="Workspace" data-item-value="${frappe.utils.escape_html(w.title)}" data-item-label="${frappe.utils.escape_html(w.title)}" data-item-icon="${w.icon || ""}" style="padding-left:${12 + depth * 14}px" data-route="${route}">
							<span class="adu-item-icon">${featherOrDot(w.icon)}</span>
							<span class="adu-item-label">${frappe.utils.escape_html(w.title)}</span>
							<span class="adu-fav-toggle" title="${__("Toggle favorite")}">★</span>
						</div>
						${children.length ? `<div class="adu-sidebar-nested">${renderLevel(w.title, depth + 1)}</div>` : ""}
					`;
				})
				.join("");
		}

		$list.html(renderLevel("__root__", 0));
		$list.off("click", ".adu-sidebar-item").on("click", ".adu-sidebar-item", function (e) {
			if ($(e.target).hasClass("adu-fav-toggle")) return;
			frappe.set_route($(this).attr("data-route"));
		});
	}

	function featherOrDot(icon) {
		return icon
			? `<i data-feather="${icon}" style="width:14px;height:14px"></i>`
			: `<span class="adu-dot"></span>`;
	}

	// --- Favorites ---
	function loadFavorites() {
		frappe.call({
			method: "advanced_desk_ui.api.sidebar.get_favorites",
			callback: (r) => {
				favoritesCache = r.message || {};
				renderFavorites();
			},
		});
	}

	function renderFavorites() {
		const $list = $root.find(".adu-favorites-list");
		const all = Object.values(favoritesCache).flat();
		if (!all.length) {
			$list.html(`<div class="adu-sidebar-empty">${__("Star items to pin them here")}</div>`);
			return;
		}
		$list.html(
			all
				.map(
					(f) => `
			<div class="adu-sidebar-item" data-item-type="${f.item_type}" data-item-value="${frappe.utils.escape_html(f.item_value)}" data-item-label="${frappe.utils.escape_html(f.label || f.item_value)}">
				<span class="adu-item-icon">${featherOrDot(f.icon)}</span>
				<span class="adu-item-label">${frappe.utils.escape_html(f.label || f.item_value)}</span>
				<span class="adu-fav-toggle active" title="${__("Remove from favorites")}">★</span>
			</div>
		`
				)
				.join("")
		);
	}

	function toggleFavorite(itemType, itemValue, label, icon) {
		frappe.call({
			method: "advanced_desk_ui.api.sidebar.toggle_favorite",
			args: { item_type: itemType, item_value: itemValue, label, icon },
			callback: () => loadFavorites(),
		});
	}

	// --- Recent ---
	function loadRecent() {
		frappe.call({
			method: "advanced_desk_ui.api.sidebar.get_recent",
			args: { limit: 8 },
			callback: (r) => {
				const items = r.message || [];
				const $list = $root.find(".adu-recent-list");
				if (!items.length) {
					$list.html(`<div class="adu-sidebar-empty">${__("Nothing visited yet")}</div>`);
					return;
				}
				$list.html(
					items
						.map(
							(item) => `
					<div class="adu-sidebar-item" data-route="${item.route}">
						<span class="adu-item-icon"><span class="adu-dot"></span></span>
						<span class="adu-item-label">${frappe.utils.escape_html(item.label)}</span>
					</div>
				`
						)
						.join("")
				);
				$list.off("click", ".adu-sidebar-item").on("click", ".adu-sidebar-item", function () {
					frappe.set_route($(this).attr("data-route"));
				});
			},
		});
	}

	// --- Search ---
	function runSearch(query) {
		const $list = $root.find(".adu-workspaces-list");
		if (!query) {
			renderWorkspaces();
			return;
		}
		frappe.call({
			method: "advanced_desk_ui.api.sidebar.search_sidebar",
			args: { query },
			callback: (r) => {
				const { workspaces = [], reports = [], doctypes = [] } = r.message || {};
				const section = (title, rows, toRoute, toLabel) =>
					rows.length
						? `<div class="adu-sidebar-section-title adu-search-group">${title}</div>` +
						  rows
								.map(
									(row) => `
						<div class="adu-sidebar-item" data-route="${toRoute(row)}">
							<span class="adu-item-icon"><span class="adu-dot"></span></span>
							<span class="adu-item-label">${frappe.utils.escape_html(toLabel(row))}</span>
						</div>`
								)
								.join("")
						: "";

				const html =
					section(__("Workspaces"), workspaces, (w) => `/app/${encodeURIComponent(w.name.toLowerCase().replace(/ /g, "-"))}`, (w) => w.title) +
					section(__("Reports"), reports, (r2) => `/app/query-report/${encodeURIComponent(r2.name)}`, (r2) => r2.report_name) +
					section(__("DocTypes"), doctypes, (d) => `/app/${frappe.router.slug(d.name)}`, (d) => d.name);

				$list.html(html || `<div class="adu-sidebar-empty">${__("No matches")}</div>`);
				$list.off("click", ".adu-sidebar-item").on("click", ".adu-sidebar-item", function () {
					frappe.set_route($(this).attr("data-route"));
				});
			},
		});
	}

	function highlightActiveRoute() {
		const current = frappe.get_route_str();
		$root.find(".adu-sidebar-item").removeClass("active");
		$root
			.find(`.adu-sidebar-item[data-route="/app/${current}"], .adu-sidebar-item[data-route="${current}"]`)
			.addClass("active");
	}

	function init() {
		build();
		if (window.feather) window.feather.replace();
	}

	return { init, toggleCollapsed, toggleFavorite };
})();

$(document).on("app_ready", function () {
	advanced_desk_ui.sidebar.init();
});
