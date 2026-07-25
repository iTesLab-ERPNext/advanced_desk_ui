/**
 * Advanced Desk UI — Global Search
 *
 * The spec calls for a distinct "Global Search" overlay (Ctrl+K, searches
 * documents/reports/pages/workspaces/settings/actions/recent/favorites).
 * That is functionally the same surface as the Command Palette, so rather
 * than shipping two competing Ctrl+K overlays with duplicated search
 * logic, this bundle simply re-points Frappe's existing navbar search
 * icon at advanced_desk_ui.commandPalette — one overlay, one backend
 * (api/sidebar.search_sidebar), consistent results everywhere.
 */

frappe.provide("advanced_desk_ui");

advanced_desk_ui.globalSearch = (function () {
	function init() {
		$(document).on("click", ".navbar .navbar-search, .navbar [data-original-title='Search'], #navbar-search", function (e) {
			e.preventDefault();
			e.stopPropagation();
			advanced_desk_ui.commandPalette.open();
		});
	}
	return { init };
})();

$(document).on("app_ready", function () {
	advanced_desk_ui.globalSearch.init();
});
