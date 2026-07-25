import json

import frappe
from frappe import _
from frappe.model.document import Document


class ADUDashboardLayout(Document):
	def before_insert(self):
		self.user = self.user or frappe.session.user

	def validate(self):
		if self.user != frappe.session.user and "System Manager" not in frappe.get_roles():
			frappe.throw(_("You can only edit your own dashboard layout."))
		if self.layout:
			try:
				json.loads(self.layout)
			except ValueError:
				frappe.throw(_("Layout must be valid JSON."))
