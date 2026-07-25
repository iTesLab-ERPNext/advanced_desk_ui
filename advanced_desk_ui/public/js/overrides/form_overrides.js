/**
 * Advanced Desk UI — Form Overrides
 *
 * Wired via hooks.doctype_js["*"] so it runs on every DocType form.
 * Everything here is additive DOM/behavior layered on top of the existing
 * frappe.ui.form.Form instance — no core form controller code is touched,
 * so field scripts, validations, and server round-trips all behave exactly
 * as they do in stock ERPNext.
 */

frappe.provide("advanced_desk_ui");

advanced_desk_ui.formOverrides = (function () {
	const AUTOSAVE_DELAY_MS = 30 * 1000;
	let autosaveTimer = null;

	function enhance(frm) {
		if (!frm || frm.__adu_enhanced) return;
		frm.__adu_enhanced = true;

		makeToolbarSticky(frm);
		addFloatingSaveButton(frm);
		addProgressIndicator(frm);
		makeSectionsCollapsible(frm);
		enhanceChildTables(frm);
		enhanceAttachments(frm);
		bindKeyboardShortcuts(frm);
		bindAutosave(frm);
	}

	function makeToolbarSticky(frm) {
		frm.page && frm.page.wrapper && $(frm.page.wrapper).find(".page-head").addClass("adu-sticky-toolbar");
	}

	function addFloatingSaveButton(frm) {
		if ($(".adu-floating-save").length) return;
		const $btn = $(`
			<button class="adu-floating-save" title="${__("Save")} (Ctrl+S)">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
			</button>
		`);
		$btn.on("click", () => frm.save());
		$("body").append($btn);

		frm.dirty_watcher = setInterval(() => {
			$btn.toggleClass("adu-visible", frm.is_dirty());
		}, 400);
	}

	function addProgressIndicator(frm) {
		if (!frm.meta || !frm.meta.fields) return;
		const mandatoryFields = frm.meta.fields.filter((f) => f.reqd && !f.hidden);
		if (!mandatoryFields.length) return;

		const $bar = $(`<div class="adu-form-progress"><div class="adu-form-progress-fill"></div></div>`);
		$(frm.page.wrapper).find(".page-head").after($bar);

		function update() {
			const filled = mandatoryFields.filter((f) => frm.doc[f.fieldname] !== undefined && frm.doc[f.fieldname] !== null && frm.doc[f.fieldname] !== "").length;
			const pct = Math.round((filled / mandatoryFields.length) * 100);
			$bar.find(".adu-form-progress-fill").css("width", pct + "%");
		}
		frm.dashboard && frm.dashboard.wrapper && $(frm.wrapper).on("change", "input, select, textarea", update);
		update();
	}

	function makeSectionsCollapsible(frm) {
		$(frm.wrapper)
			.find(".form-section:not(.adu-collapsible-bound)")
			.each(function () {
				const $section = $(this).addClass("adu-collapsible-bound");
				const $head = $section.find(".section-head").first();
				if (!$head.length) return;
				$head.addClass("adu-section-head-modern");
				$head.on("click", function (e) {
					if ($(e.target).is("a, button, input")) return;
					$section.toggleClass("adu-section-collapsed");
				});
			});
	}

	function enhanceChildTables(frm) {
		$(frm.wrapper).find(".grid-heading-row, .grid-static-col").addClass("adu-sticky-col-header");
	}

	function enhanceAttachments(frm) {
		$(frm.wrapper)
			.find(".attachment-row, .attachment-link")
			.each(function () {
				const href = $(this).find("a").attr("href") || "";
				if (/\.(png|jpe?g|gif|webp|svg)$/i.test(href) && !$(this).find(".adu-attachment-preview").length) {
					$(this).prepend(`<img class="adu-attachment-preview" src="${href}" loading="lazy" />`);
				}
			});
	}

	function bindKeyboardShortcuts(frm) {
		// Ctrl+S already saves in core; this adds a couple of extras.
		frappe.ui.keys.on("ctrl+shift+n", () => frm.save("Save"));
	}

	function bindAutosave(frm) {
		if (!frm.meta || frm.meta.issingle) return;
		$(frm.wrapper).on("change input", "input, select, textarea", () => {
			clearTimeout(autosaveTimer);
			autosaveTimer = setTimeout(() => {
				if (frm.is_dirty() && !frm.is_new() && frm.doc.docstatus === 0) {
					frm.save("Save", null, null, () => {
						frappe.show_alert({ message: __("Auto-saved"), indicator: "blue" }, 2);
					});
				}
			}, AUTOSAVE_DELAY_MS);
		});
	}

	function init() {
		$(document).on("app_ready", () => {
			frappe.ui.form.on("*", {
				refresh(frm) {
					enhance(frm);
					makeSectionsCollapsible(frm); // re-run: new sections can render after refresh
					enhanceChildTables(frm);
					enhanceAttachments(frm);
				},
			});
		});
	}

	return { init };
})();

advanced_desk_ui.formOverrides.init();
