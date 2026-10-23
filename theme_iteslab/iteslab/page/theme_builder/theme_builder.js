// Theme Builder — a visual editor for Theme Settings.
//
// The page never writes CSS files. It edits an in-memory copy of the settings,
// paints the resulting variables into a scoped preview so changes are visible
// immediately, and saves through theme_iteslab.api.save_theme, which runs the
// normal permission check.

frappe.pages["theme-builder"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Theme Builder"),
		single_column: true,
	});

	new ThemeBuilder(page);
};

const GROUPS = [
	{
		key: "general",
		label: __("General"),
		fields: [
			{ fieldname: "theme_preset", label: __("Preset"), type: "preset" },
			{
				fieldname: "density",
				label: __("Density"),
				type: "select",
				options: ["Comfortable", "Compact"],
			},
			{ fieldname: "enable_animations", label: __("Use transitions"), type: "check" },
			{ fieldname: "enable_theme", label: __("Theme enabled"), type: "check" },
		],
	},
	{
		key: "colors",
		label: __("Colours"),
		fields: [
			{ fieldname: "primary_color", label: __("Primary"), type: "color" },
			{ fieldname: "secondary_color", label: __("Secondary"), type: "color" },
			{ fieldname: "background_color", label: __("Background"), type: "color" },
			{ fieldname: "surface_color", label: __("Surface"), type: "color" },
			{ fieldname: "text_color", label: __("Text"), type: "color" },
			{ fieldname: "muted_text_color", label: __("Muted text"), type: "color" },
			{ fieldname: "border_color", label: __("Border"), type: "color" },
			{ fieldname: "success_color", label: __("Success"), type: "color" },
			{ fieldname: "warning_color", label: __("Warning"), type: "color" },
			{ fieldname: "error_color", label: __("Error"), type: "color" },
		],
	},
	{
		key: "sidebar",
		label: __("Sidebar"),
		fields: [
			{ fieldname: "sidebar_background", label: __("Background"), type: "color" },
			{ fieldname: "sidebar_text", label: __("Text"), type: "color" },
			{ fieldname: "sidebar_active", label: __("Active"), type: "color" },
			{ fieldname: "sidebar_hover", label: __("Hover"), type: "color" },
			{ fieldname: "sidebar_icon", label: __("Icon"), type: "color" },
			{
				fieldname: "sidebar_width",
				label: __("Width (px)"),
				type: "number",
				min: 180,
				max: 380,
				note: __("v15 only — on v16 the sidebar has its own resize handle."),
			},
			{ fieldname: "collapse_sidebar_by_default", label: __("Start collapsed"), type: "check" },
		],
	},
	{
		key: "navbar",
		label: __("Navbar"),
		// v16 has no top navbar; the tab stays visible but says so.
		note: __("v15 only. v16 has no top navbar — its shell lives in the sidebar."),
		fields: [
			{ fieldname: "navbar_background", label: __("Background"), type: "color" },
			{ fieldname: "navbar_text", label: __("Text"), type: "color" },
			{ fieldname: "navbar_border", label: __("Border"), type: "color" },
			{ fieldname: "navbar_search_background", label: __("Search background"), type: "color" },
			{ fieldname: "navbar_height", label: __("Height (px)"), type: "number", min: 48, max: 88 },
		],
	},
	{
		key: "cards",
		label: __("Cards"),
		fields: [
			{ fieldname: "card_radius", label: __("Radius (px)"), type: "number", min: 0, max: 32 },
			{ fieldname: "card_padding", label: __("Padding (px)"), type: "number", min: 8, max: 40 },
			{
				fieldname: "shadow_size",
				label: __("Shadow"),
				type: "select",
				options: ["None", "Small", "Medium", "Large"],
			},
		],
	},
	{
		key: "buttons",
		label: __("Buttons"),
		fields: [
			{ fieldname: "button_radius", label: __("Radius (px)"), type: "number", min: 0, max: 32 },
			{ fieldname: "button_height", label: __("Height (px)"), type: "number", min: 24, max: 48 },
			{
				fieldname: "button_font_weight",
				label: __("Label weight"),
				type: "select",
				options: ["400", "500", "600", "700"],
			},
		],
	},
	{
		key: "forms",
		label: __("Forms"),
		fields: [
			{ fieldname: "input_radius", label: __("Input radius (px)"), type: "number", min: 0, max: 32 },
			{ fieldname: "input_height", label: __("Input height (px)"), type: "number", min: 24, max: 48 },
			{
				fieldname: "form_section_spacing",
				label: __("Space between sections (px)"),
				type: "number",
				min: 8,
				max: 40,
			},
		],
	},
	{
		key: "tables",
		label: __("Tables"),
		note: __("Applies to list views, report tables, child tables and datatables."),
		fields: [
			{ fieldname: "table_header_background", label: __("Header background"), type: "color" },
			{ fieldname: "table_header_text", label: __("Header text"), type: "color" },
			{ fieldname: "table_border_color", label: __("Border"), type: "color" },
			{ fieldname: "table_row_hover", label: __("Row hover"), type: "color" },
			{ fieldname: "table_stripe_color", label: __("Stripe"), type: "color" },
			{ fieldname: "zebra_tables", label: __("Striped rows"), type: "check" },
			{
				fieldname: "table_border_style",
				label: __("Borders"),
				type: "select",
				options: ["All", "Horizontal", "None"],
			},
			{ fieldname: "table_row_height", label: __("Row height (px)"), type: "number", min: 28, max: 64 },
			{ fieldname: "table_cell_padding", label: __("Cell padding (px)"), type: "number", min: 4, max: 24 },
			{
				fieldname: "table_header_font_size",
				label: __("Header font size (px)"),
				type: "number",
				min: 10,
				max: 16,
			},
			{ fieldname: "table_sticky_header", label: __("Keep header visible"), type: "check" },
			{ fieldname: "table_header_uppercase", label: __("Uppercase headers"), type: "check" },
		],
	},
	{
		key: "dark",
		label: __("Dark Mode"),
		note: __("Leave a colour empty to derive it from the palette."),
		fields: [
			{
				fieldname: "default_appearance",
				label: __("Default appearance"),
				type: "select",
				options: ["Light", "Dark", "System"],
			},
			{ fieldname: "dark_background_color", label: __("Background"), type: "color", optional: true },
			{ fieldname: "dark_surface_color", label: __("Surface"), type: "color", optional: true },
			{ fieldname: "dark_text_color", label: __("Text"), type: "color", optional: true },
			{ fieldname: "dark_border_color", label: __("Border"), type: "color", optional: true },
		],
	},
	{
		key: "advanced",
		label: __("Advanced"),
		fields: [{ fieldname: "custom_css", label: __("Custom CSS"), type: "code" }],
	},
];

class ThemeBuilder {
	constructor(page) {
		this.page = page;
		this.settings = {};
		this.presets = [];
		this.activeGroup = "general";
		this.dirty = false;

		this.render_shell();
		this.load();
		this.bind_page_actions();
	}

	// --- data ---------------------------------------------------------------

	load() {
		frappe.call({
			method: "theme_iteslab.api.get_settings_and_presets",
			freeze: true,
			freeze_message: __("Loading theme"),
			callback: (r) => {
				if (!r.message) return;
				this.settings = Object.assign({}, r.message.settings);
				this.defaults = r.message.defaults;
				this.presets = r.message.presets;
				this.render_fields();
				this.refresh_preview();
			},
		});
	}

	set_value(fieldname, value) {
		this.settings[fieldname] = value;
		this.dirty = true;
		this.page.set_indicator(__("Unsaved"), "orange");
		this.refresh_preview();
	}

	// --- shell --------------------------------------------------------------

	render_shell() {
		this.page.main.html(`
			<div class="iteslab-builder">
				<div class="iteslab-builder__panel">
					<p class="iteslab-builder__hint">
						${__("Changes preview on the right. Nothing is applied to the Desk until you save.")}
					</p>
					<div class="iteslab-builder__tabs" role="tablist"></div>
					<div class="iteslab-builder__groups"></div>
					<div class="iteslab-builder__actions">
						<button class="btn btn-primary btn-sm" data-action="save">${__("Save theme")}</button>
						<button class="btn btn-default btn-sm" data-action="revert">${__("Discard changes")}</button>
						<button class="btn btn-default btn-sm" data-action="reset">${__("Reset to default")}</button>
					</div>
				</div>
				<div class="iteslab-preview" id="iteslab-preview">
					<div class="iteslab-preview__bar">
						<span>ItesLab</span>
						<span class="iteslab-preview__search"></span>
					</div>
					<div class="iteslab-preview__body">
						<div class="iteslab-preview__rail">
							<div class="iteslab-preview__item is-active"><span class="dot"></span>${__("Home")}</div>
							<div class="iteslab-preview__item"><span class="dot"></span>${__("Accounting")}</div>
							<div class="iteslab-preview__item"><span class="dot"></span>${__("Selling")}</div>
							<div class="iteslab-preview__item"><span class="dot"></span>${__("Stock")}</div>
							<div class="iteslab-preview__item"><span class="dot"></span>${__("Settings")}</div>
						</div>
						<div class="iteslab-preview__main">
							<div class="iteslab-preview__card">
								<div class="label">${__("Customers")}</div>
								<div class="value">1,245</div>
							</div>
							<div class="iteslab-preview__card">
								<div class="label">${__("Quotations")}</div>
								<div class="value">348</div>
							</div>
							<div class="iteslab-preview__card">
								<div class="label">${__("Sales Orders")}</div>
								<div class="value">782</div>
							</div>
							<div class="iteslab-preview__row">
								<span class="iteslab-preview__btn primary">${__("Create")}</span>
								<span class="iteslab-preview__btn secondary">${__("Filter")}</span>
								<span class="iteslab-preview__btn success">${__("Submit")}</span>
								<span class="iteslab-preview__btn danger">${__("Cancel")}</span>
								<span class="iteslab-preview__input"></span>
							</div>
							<div class="iteslab-preview__tablewrap">
								<table class="iteslab-preview__table">
									<thead>
										<tr>
											<th>${__("Customer")}</th>
											<th>${__("Status")}</th>
											<th>${__("Date")}</th>
										</tr>
									</thead>
									<tbody>
										<tr><td>ABC Company</td><td>${__("Active")}</td><td>${__("Today")}</td></tr>
										<tr><td>XYZ Company</td><td>${__("Pending")}</td><td>${__("Yesterday")}</td></tr>
										<tr><td>Acme Traders</td><td>${__("Active")}</td><td>${__("Last week")}</td></tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>
		`);

		const tabs = this.page.main.find(".iteslab-builder__tabs");
		GROUPS.forEach((group) => {
			$(`<button class="iteslab-builder__tab" role="tab" data-group="${group.key}">${group.label}</button>`)
				.attr("aria-selected", group.key === this.activeGroup)
				.on("click", () => this.activate(group.key))
				.appendTo(tabs);
		});

		this.page.main.on("click", "[data-action]", (event) => {
			const action = $(event.currentTarget).data("action");
			if (action === "save") this.save();
			if (action === "revert") this.load();
			if (action === "reset") this.reset();
		});
	}

	activate(key) {
		this.activeGroup = key;
		this.page.main
			.find(".iteslab-builder__tab")
			.each((_, el) => $(el).attr("aria-selected", $(el).data("group") === key));
		this.page.main
			.find(".iteslab-builder__group")
			.each((_, el) => $(el).toggleClass("is-active", $(el).data("group") === key));
	}

	// --- fields -------------------------------------------------------------

	render_fields() {
		const host = this.page.main.find(".iteslab-builder__groups").empty();

		GROUPS.forEach((group) => {
			const section = $(`<div class="iteslab-builder__group" data-group="${group.key}"></div>`)
				.toggleClass("is-active", group.key === this.activeGroup)
				.appendTo(host);

			if (group.note) {
				$('<p class="iteslab-builder__note"></p>').text(group.note).appendTo(section);
			}

			group.fields.forEach((field) => section.append(this.render_field(field)));
		});
	}

	render_field(field) {
		const value = this.settings[field.fieldname];
		const row = $('<div class="iteslab-builder__field"></div>');
		$("<label></label>").text(field.label).appendTo(row);
		const control = $('<div class="iteslab-builder__control"></div>').appendTo(row);

		if (field.type === "color") {
			const swatch = $('<input type="color" class="iteslab-builder__swatch">').val(value || "#000000");
			const hex = $('<input type="text" class="form-control input-sm iteslab-builder__hex">')
				.val(value || "")
				.attr("placeholder", field.optional ? __("derived") : "");

			swatch.on("input", () => {
				hex.val(swatch.val().toUpperCase());
				this.set_value(field.fieldname, swatch.val().toUpperCase());
			});
			hex.on("change", () => {
				// An optional colour may be emptied, which means "derive it".
				if (field.optional && !hex.val().trim()) {
					this.set_value(field.fieldname, "");
					return;
				}

				const cleaned = this.normalise_hex(hex.val());
				if (!cleaned) {
					hex.val(this.settings[field.fieldname] || "");
					frappe.show_alert({ message: __("Enter a hex colour like #1DA1F2"), indicator: "orange" });
					return;
				}
				hex.val(cleaned);
				swatch.val(cleaned);
				this.set_value(field.fieldname, cleaned);
			});

			control.append(swatch, hex);

			if (field.optional) {
				const clear = $('<button class="btn btn-xs btn-default"></button>').text(__("Clear"));
				clear.on("click", () => {
					hex.val("");
					this.set_value(field.fieldname, "");
				});
				control.append(clear);
			}
		} else if (field.type === "number") {
			const input = $('<input type="number" class="form-control input-sm iteslab-builder__number">')
				.attr({ min: field.min, max: field.max })
				.val(value);
			input.on("change", () => {
				let next = cint(input.val());
				next = Math.max(field.min, Math.min(field.max, next));
				input.val(next);
				this.set_value(field.fieldname, next);
			});
			control.append(input);
		} else if (field.type === "select") {
			const select = $('<select class="form-control input-sm"></select>');
			field.options.forEach((option) =>
				select.append($("<option></option>").attr("value", option).text(__(option)))
			);
			select.val(value);
			select.on("change", () => this.set_value(field.fieldname, select.val()));
			control.append(select);
		} else if (field.type === "preset") {
			const select = $('<select class="form-control input-sm"></select>');
			this.presets.concat(["Custom"]).forEach((option) =>
				select.append($("<option></option>").attr("value", option).text(__(option)))
			);
			select.val(value || "ItesLab Default");
			select.on("change", () => this.apply_preset(select.val()));
			control.append(select);
		} else if (field.type === "check") {
			const input = $('<input type="checkbox">').prop("checked", !!cint(value));
			input.on("change", () => this.set_value(field.fieldname, input.is(":checked") ? 1 : 0));
			control.append(input);
		} else if (field.type === "code") {
			row.css({ display: "block" });
			const area = $('<textarea class="form-control" rows="10" spellcheck="false"></textarea>')
				.val(value || "")
				.css({ "font-family": "var(--font-stack-mono, monospace)", "font-size": "12px", "margin-top": "8px" });
			area.on("change", () => this.set_value(field.fieldname, area.val()));
			row.append(area);
			return row;
		}

		if (field.note) {
			const wrapper = $('<div class="iteslab-builder__field-wrap"></div>');
			wrapper.append(row);
			$('<p class="iteslab-builder__note iteslab-builder__note--field"></p>')
				.text(field.note)
				.appendTo(wrapper);
			return wrapper;
		}

		return row;
	}

	normalise_hex(value) {
		let cleaned = (value || "").trim().replace(/^#/, "");
		if (cleaned.length === 3) cleaned = cleaned.split("").map((c) => c + c).join("");
		if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
		return "#" + cleaned.toUpperCase();
	}

	// --- preview ------------------------------------------------------------

	refresh_preview() {
		frappe.call({
			method: "theme_iteslab.api.preview_payload",
			args: { values: this.settings },
			callback: (r) => {
				if (!r.message) return;
				const preview = document.getElementById("iteslab-preview");
				if (!preview) return;

				const dark = document.documentElement.getAttribute("data-theme") === "dark";
				const vars = Object.assign(
					{},
					r.message.shared_vars,
					dark ? r.message.dark_vars : r.message.vars
				);

				// Scope the variables to the preview element, so the Desk around
				// it keeps the currently saved theme until the user saves.
				for (const [name, value] of Object.entries(vars)) {
					preview.style.setProperty(name, value);
				}

				// The class-driven settings (border style, stripes, sticky and
				// uppercase headers) are mirrored onto the preview so the sample
				// table shows them without touching the Desk around it.
				const message = r.message;
				for (const option of ["all", "horizontal", "none"]) {
					preview.classList.toggle(
						`iteslab-preview--borders-${option}`,
						(message.table_border_style || "horizontal") === option
					);
				}
				preview.classList.toggle("iteslab-preview--zebra", !!message.zebra_tables);
				preview.classList.toggle("iteslab-preview--upper", !!message.table_header_uppercase);
			},
		});
	}

	// --- actions ------------------------------------------------------------

	apply_preset(preset) {
		if (preset === "Custom") return;

		frappe.call({
			method: "theme_iteslab.api.apply_preset",
			args: { preset },
			callback: (r) => {
				if (!r.message) return;
				this.settings = Object.assign({}, r.message.settings, {
					custom_css: this.settings.custom_css,
				});
				this.dirty = true;
				this.page.set_indicator(__("Unsaved"), "orange");
				this.render_fields();
				this.refresh_preview();
			},
		});
	}

	save() {
		frappe.call({
			method: "theme_iteslab.api.save_theme",
			args: { values: this.settings },
			freeze: true,
			freeze_message: __("Saving theme"),
			callback: (r) => {
				if (!r.message) return;
				this.dirty = false;
				this.page.set_indicator(__("Saved"), "green");
				// Apply straight away in this tab; other open tabs get it over
				// realtime from the server.
				if (window.iteslab && window.iteslab.theme) window.iteslab.theme.apply(r.message);
			},
		});
	}

	reset() {
		frappe.confirm(__("Replace the current palette with ItesLab Default?"), () => {
			frappe.call({
				method: "theme_iteslab.api.reset_theme",
				freeze: true,
				freeze_message: __("Resetting theme"),
				callback: (r) => {
					if (r.message && window.iteslab && window.iteslab.theme) {
						window.iteslab.theme.apply(r.message);
					}
					this.load();
					this.page.set_indicator(__("Reset"), "blue");
				},
			});
		});
	}

	bind_page_actions() {
		this.page.set_primary_action(__("Save theme"), () => this.save());

		this.page.set_secondary_action(__("Open Theme Settings"), () =>
			frappe.set_route("Form", "Theme Settings")
		);

		this.page.add_menu_item(__("Toggle dark preview"), () => {
			const root = document.documentElement;
			const dark = root.getAttribute("data-theme") === "dark";
			frappe.ui.set_theme(dark ? "light" : "dark");
			this.refresh_preview();
		});

		// Leaving with unsaved edits should be a deliberate choice — but the
		// warning must not outlive this page.
		//
		// This previously unbound on the wrapper's "remove" event, which jQuery
		// never fires, so the handler survived every later navigation. A stale
		// beforeunload cancels any window.location assignment, which is exactly
		// how a logout redirect ends up doing nothing. It is now released when
		// the router leaves this page, and again on logout.
		$(window).on("beforeunload.iteslab-builder", () => (this.dirty ? true : undefined));

		const release = () => $(window).off("beforeunload.iteslab-builder");

		if (frappe.router && frappe.router.on) {
			frappe.router.on("change", () => {
				if (frappe.get_route()[0] !== "theme-builder") release();
			});
		}

		$(document).on("page-change.iteslab-builder", () => {
			if (frappe.get_route()[0] !== "theme-builder") release();
		});

		// Belt and braces: never stand between a user and the exit.
		document.addEventListener(
			"click",
			(event) => {
				if (event.target.closest && event.target.closest("[data-name='logout'], #toolbar-user .dropdown-item")) {
					release();
				}
			},
			true
		);
	}
}
