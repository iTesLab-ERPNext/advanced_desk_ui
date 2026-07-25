import json

import frappe
from frappe import _
from frappe.model.document import Document


class AdvancedDeskSettings(Document):
	def validate(self):
		self.validate_hex_colors()
		self.validate_dashboard_layout()

	def validate_hex_colors(self):
		import re

		hex_re = re.compile(r"^#(?:[0-9a-fA-F]{3}){1,2}$")
		for field in ("primary_color", "secondary_color", "accent_color", "sidebar_color", "navbar_color"):
			value = self.get(field)
			if value and not hex_re.match(value):
				frappe.throw(_("{0} must be a valid hex color (e.g. #4f46e5).").format(field))

	def validate_dashboard_layout(self):
		if self.default_dashboard_layout:
			try:
				json.loads(self.default_dashboard_layout)
			except ValueError:
				frappe.throw(_("Default Dashboard Layout must be valid JSON."))

	def on_update(self):
		from advanced_desk_ui.utils.cache import clear_theme_cache

		clear_theme_cache()
