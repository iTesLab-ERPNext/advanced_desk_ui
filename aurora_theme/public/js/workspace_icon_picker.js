/**
 * Aurora Theme — Workspace Animated Icon Picker
 *
 * Adds a small picker dialog next to the `aurora_animated_icon` field
 * (a plain Data field storing an Iconify icon code, e.g.
 * "ph:rocket-launch-duotone"). Renders a live preview using the
 * `<iconify-icon>` web component and a curated starter set grouped by
 * theme, since bundling Iconify's full icon index would be enormous —
 * the free-text field still accepts any valid Iconify code beyond the
 * curated set.
 */

const AURORA_ICON_SET = [
	"ph:house-duotone",
	"ph:users-three-duotone",
	"ph:currency-circle-dollar-duotone",
	"ph:chart-line-up-duotone",
	"ph:shopping-cart-simple-duotone",
	"ph:package-duotone",
	"ph:receipt-duotone",
	"ph:truck-duotone",
	"ph:calendar-check-duotone",
	"ph:gear-six-duotone",
	"ph:rocket-launch-duotone",
	"ph:chat-circle-dots-duotone",
	"ph:folder-open-duotone",
	"ph:handshake-duotone",
	"ph:target-duotone",
	"ph:database-duotone",
];

frappe.ui.form.on("Workspace", {
	refresh(frm) {
		if (!frm.fields_dict.aurora_animated_icon || frm.__aurora_icon_picker_bound) return;
		frm.__aurora_icon_picker_bound = true;

		frm.set_df_property("aurora_animated_icon", "description", __("Iconify icon code — click the button to browse a starter set."));

		frm.add_custom_button(__("Pick Animated Icon"), () => openPicker(frm)).addClass("btn-sm");
	},
});

function openPicker(frm) {
	const dialog = new frappe.ui.Dialog({
		title: __("Pick an Animated Icon"),
		fields: [
			{
				fieldtype: "Data",
				fieldname: "icon_code",
				label: __("Iconify Code"),
				default: frm.doc.aurora_animated_icon,
				description: __("Type any valid Iconify code (e.g. mdi:home) or pick from the grid below."),
			},
			{ fieldtype: "HTML", fieldname: "icon_grid" },
		],
		primary_action_label: __("Use This Icon"),
		primary_action(values) {
			frm.set_value("aurora_animated_icon", values.icon_code);
			dialog.hide();
		},
	});

	const $grid = dialog.fields_dict.icon_grid.$wrapper;
	$grid.html(`
		<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:8px">
			${AURORA_ICON_SET.map(
				(code) => `
				<div class="aurora-icon-choice" data-code="${code}" style="border:1px solid var(--border-color,#ddd);border-radius:8px;padding:10px;text-align:center;cursor:pointer;font-size:22px">
					<iconify-icon icon="${code}"></iconify-icon>
				</div>`
			).join("")}
		</div>
	`);

	$grid.on("click", ".aurora-icon-choice", function () {
		const code = $(this).attr("data-code");
		dialog.set_value("icon_code", code);
	});

	dialog.show();
}
