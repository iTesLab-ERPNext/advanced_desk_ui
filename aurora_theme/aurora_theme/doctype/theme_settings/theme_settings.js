// Copyright (c) 2026, Aurora Theme contributors
// For license information, please see license.txt

frappe.ui.form.on("Theme Settings", {
	refresh(frm) {
		frm.dashboard.set_headline(
			__("Changes here apply instantly to every Desk session — no rebuild needed for colors, only for structural CSS/JS edits.")
		);
	},
});
