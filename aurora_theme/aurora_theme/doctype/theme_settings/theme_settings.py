# Copyright (c) 2026, Aurora Theme contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class ThemeSettings(Document):
	def on_update(self):
		frappe.cache().delete_value("aurora_theme:css_vars")
