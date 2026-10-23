"""Theme Settings — the stored configuration for Theme ItesLab.

A Single DocType. It holds presentation values only; no business data and no
permission flags. Saving it clears the cached payload and pushes the new palette
to every open session (see theme_iteslab.api.clear_theme_cache, wired through the
doc_events hook).
"""

import frappe
from frappe import _
from frappe.model.document import Document

from theme_iteslab.presets import COLOR_VARIABLE_MAP, DARK_OVERRIDE_MAP, DEFAULTS


class ThemeSettings(Document):
	def validate(self):
		self.normalise_colors()
		self.normalise_optional_colors()
		self.apply_sensible_bounds()
		self.flag_custom_preset()

	def normalise_colors(self):
		"""Accept #abc, abc123 or #ABC123 and store a consistent #RRGGBB."""
		for field in COLOR_VARIABLE_MAP:
			value = (self.get(field) or "").strip()
			if not value:
				self.set(field, DEFAULTS.get(field))
				continue

			cleaned = value.lstrip("#")
			if len(cleaned) == 3:
				cleaned = "".join(char * 2 for char in cleaned)

			if len(cleaned) != 6 or any(char not in "0123456789abcdefABCDEF" for char in cleaned):
				frappe.throw(
					_("{0} is not a valid hex colour: {1}").format(_(self.meta.get_label(field)), value)
				)

			self.set(field, "#" + cleaned.upper())

	def normalise_optional_colors(self):
		"""The dark overrides may be empty, but must be valid hex when set."""
		for field in DARK_OVERRIDE_MAP:
			value = (self.get(field) or "").strip()
			if not value:
				self.set(field, "")
				continue

			cleaned = value.lstrip("#")
			if len(cleaned) == 3:
				cleaned = "".join(char * 2 for char in cleaned)

			if len(cleaned) != 6 or any(char not in "0123456789abcdefABCDEF" for char in cleaned):
				frappe.throw(
					_("{0} is not a valid hex colour: {1}").format(_(self.meta.get_label(field)), value)
				)

			self.set(field, "#" + cleaned.upper())

	def apply_sensible_bounds(self):
		"""Keep sizes inside a range that still produces a usable Desk."""
		bounds = {
			"sidebar_width": (180, 380),
			"navbar_height": (48, 88),
			"card_radius": (0, 32),
			"button_radius": (0, 32),
			"input_radius": (0, 32),
			"card_padding": (8, 40),
			"button_height": (24, 48),
			"input_height": (24, 48),
			"form_section_spacing": (8, 40),
			"table_row_height": (28, 64),
			"table_cell_padding": (4, 24),
			"table_header_font_size": (10, 16),
		}
		for field, (low, high) in bounds.items():
			value = frappe.utils.cint(self.get(field)) or frappe.utils.cint(DEFAULTS.get(field))
			self.set(field, max(low, min(high, value)))

	def flag_custom_preset(self):
		"""If the values no longer match the chosen preset, call it Custom."""
		from theme_iteslab.presets import PRESETS

		preset = PRESETS.get(self.theme_preset)
		if not preset:
			return

		tracked = list(COLOR_VARIABLE_MAP.keys()) + [
			"card_radius",
			"button_radius",
			"input_radius",
			"card_padding",
			"shadow_size",
			"sidebar_width",
			"navbar_height",
			"button_height",
			"button_font_weight",
			"input_height",
			"form_section_spacing",
			"table_row_height",
			"table_cell_padding",
			"table_header_font_size",
			"table_border_style",
		]
		for field in tracked:
			stored = self.get(field)
			expected = preset.get(field)
			if isinstance(expected, int):
				if frappe.utils.cint(stored) != expected:
					self.theme_preset = "Custom"
					return
			elif (stored or "") != (expected or ""):
				self.theme_preset = "Custom"
				return
