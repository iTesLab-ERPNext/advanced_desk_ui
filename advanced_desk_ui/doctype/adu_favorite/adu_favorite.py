import frappe
from frappe import _
from frappe.model.document import Document


class ADUFavorite(Document):
	def before_insert(self):
		self.user = frappe.session.user

	def validate(self):
		if self.user != frappe.session.user and "System Manager" not in frappe.get_roles():
			frappe.throw(_("You can only manage your own favorites."))

	def before_save(self):
		# prevent duplicates instead of relying on a DB unique index across
		# three columns (kept simple/portable across DB backends)
		existing = frappe.db.exists(
			"ADU Favorite",
			{
				"user": self.user,
				"item_type": self.item_type,
				"item_value": self.item_value,
				"name": ["!=", self.name],
			},
		)
		if existing:
			frappe.throw(_("This item is already in your favorites."))
