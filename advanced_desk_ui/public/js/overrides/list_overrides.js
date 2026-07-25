/**
 * Advanced Desk UI — List View Overrides
 *
 * Frappe's ListView already handles data fetching, pagination, bulk
 * actions, and permissions — this file only restyles/augments the
 * rendered DOM (sticky header, frozen first column, a lightweight column
 * picker, and a quick-filter chip row) so none of that core logic is
 * duplicated or forked.
 */

frappe.provide("advanced_desk_ui");

advanced_desk_ui.listOverrides = (function () {
	const LS_HIDDEN_COLS = (doctype) => `adu:list:${doctype}:hidden_cols`;

	function enhance() {
		const route = frappe.get_route();
		if (!route.length || route[0] !== "List") return;
		const doctype = route[1];
		if (!doctype) return;

		$(".list-row-head, .list-row-container").addClass("adu-sticky-list-header");
		addColumnPicker(doctype);
		addQuickFilterChips(doctype);
		applyHiddenColumns(doctype);
	}

	function addColumnPicker(doctype) {
		const $toolbar = $(".list-view-toolbar, .page-actions").first();
		if (!$toolbar.length || $toolbar.find(".adu-column-picker-btn").length) return;

		const $btn = $(`
			<button class="btn btn-default btn-sm adu-column-picker-btn" title="${__("Choose columns")}">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/></svg>
			</button>
		`);
		$btn.on("click", () => openColumnPickerDialog(doctype));
		$toolbar.prepend($btn);
	}

	function openColumnPickerDialog(doctype) {
		frappe.model.with_doctype(doctype, () => {
			const meta = frappe.get_meta(doctype);
			const hidden = getHiddenColumns(doctype);
			const fields = meta.fields.filter((f) => !f.hidden && f.fieldtype !== "Section Break" && f.fieldtype !== "Column Break");

			const dialog = new frappe.ui.Dialog({
				title: __("Choose Columns"),
				fields: fields.map((f) => ({
					fieldtype: "Check",
					fieldname: f.fieldname,
					label: f.label || f.fieldname,
					default: hidden.indexOf(f.fieldname) === -1,
				})),
				primary_action_label: __("Apply"),
				primary_action(values) {
					const newHidden = Object.keys(values).filter((k) => !values[k]);
					try {
						localStorage.setItem(LS_HIDDEN_COLS(doctype), JSON.stringify(newHidden));
					} catch (e) {
						/* noop */
					}
					applyHiddenColumns(doctype);
					dialog.hide();
				},
			});
			dialog.show();
		});
	}

	function getHiddenColumns(doctype) {
		try {
			return JSON.parse(localStorage.getItem(LS_HIDDEN_COLS(doctype)) || "[]");
		} catch (e) {
			return [];
		}
	}

	function applyHiddenColumns(doctype) {
		const hidden = getHiddenColumns(doctype);
		hidden.forEach((fieldname) => {
			$(`.list-row-col[data-fieldname="${fieldname}"]`).addClass("adu-col-hidden");
		});
	}

	function addQuickFilterChips(doctype) {
		const $filterArea = $(".list-view-filter-area, .filter-area").first();
		if (!$filterArea.length || $filterArea.find(".adu-quick-filter-chips").length) return;

		frappe.model.with_doctype(doctype, () => {
			const meta = frappe.get_meta(doctype);
			const statusField = meta.fields.find((f) => f.fieldname === "status" && f.fieldtype === "Select");
			if (!statusField || !statusField.options) return;

			const options = statusField.options.split("\n").filter(Boolean).slice(0, 6);
			const $chips = $(`
				<div class="adu-quick-filter-chips">
					<span class="adu-chip" data-value="">${__("All")}</span>
					${options.map((o) => `<span class="adu-chip" data-value="${frappe.utils.escape_html(o)}">${frappe.utils.escape_html(o)}</span>`).join("")}
				</div>
			`);
			$filterArea.before($chips);

			$chips.on("click", ".adu-chip", function () {
				$chips.find(".adu-chip").removeClass("active");
				$(this).addClass("active");
				const value = $(this).attr("data-value");
				const list_view = cur_list;
				if (!list_view) return;
				if (value) {
					list_view.filter_area.add(doctype, "status", "=", value);
				} else {
					list_view.filter_area.remove("status");
				}
			});
		});
	}

	function init() {
		frappe.router.on("change", () => setTimeout(enhance, 250));
	}

	return { init };
})();

$(document).on("app_ready", function () {
	advanced_desk_ui.listOverrides.init();
});
