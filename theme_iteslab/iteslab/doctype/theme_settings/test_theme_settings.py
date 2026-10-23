import frappe
from frappe.tests.utils import FrappeTestCase

from theme_iteslab.api import build_payload, get_settings


class TestThemeSettings(FrappeTestCase):
	def test_short_hex_is_expanded(self):
		doc = frappe.get_single("Theme Settings")
		doc.primary_color = "#abc"
		doc.validate()
		self.assertEqual(doc.primary_color, "#AABBCC")

	def test_invalid_hex_is_rejected(self):
		doc = frappe.get_single("Theme Settings")
		doc.primary_color = "not-a-colour"
		with self.assertRaises(frappe.ValidationError):
			doc.validate()

	def test_sidebar_width_is_clamped(self):
		doc = frappe.get_single("Theme Settings")
		doc.sidebar_width = 9000
		doc.validate()
		self.assertLessEqual(doc.sidebar_width, 380)

	def test_payload_has_both_colour_schemes(self):
		payload = build_payload(get_settings())
		self.assertIn("--iteslab-primary", payload["vars"])
		self.assertIn("--iteslab-background", payload["dark_vars"])
		self.assertIn("--iteslab-card-radius", payload["shared_vars"])
		self.assertTrue(payload["shared_vars"]["--iteslab-card-radius"].endswith("px"))


class TestCompat(FrappeTestCase):
	"""The version layer must pick a shell for whatever Frappe is running."""

	def test_shell_matches_running_version(self):
		from theme_iteslab.compat import frappe_major, shell

		major = frappe_major()
		expected = "v16" if major >= 16 else "v15"
		self.assertEqual(shell(), expected)

	def test_css_list_has_exactly_one_shell(self):
		from theme_iteslab.compat import SHELL_CSS, desk_css

		sheets = desk_css()
		shells = [s for s in sheets if s.startswith("iteslab-shell-")]
		self.assertEqual(len(shells), 1, "exactly one shell layer must be loaded")
		self.assertIn(shells[0], SHELL_CSS["v15"] + SHELL_CSS["v16"])

	def test_tokens_load_before_the_shell(self):
		"""Cascade order is load order, so the variables must come first."""
		sheets = self._sheets()
		self.assertEqual(sheets[0], "iteslab-variables.bundle.css")
		shell_at = next(i for i, s in enumerate(sheets) if s.startswith("iteslab-shell-"))
		self.assertLess(sheets.index("iteslab-variables.bundle.css"), shell_at)
		self.assertGreater(sheets.index("iteslab-dark.bundle.css"), shell_at)
		self.assertEqual(sheets[-1], "iteslab-responsive.bundle.css")

	def test_payload_reports_the_shell(self):
		from theme_iteslab.api import build_payload
		from theme_iteslab.compat import shell

		payload = build_payload()
		self.assertEqual(payload["shell"], shell())
		self.assertIn(payload["shell"], ("v15", "v16"))

	def _sheets(self):
		from theme_iteslab.compat import desk_css

		return desk_css()


class TestTableStyles(FrappeTestCase):
	"""The Tables tab must reach the CSS, in both colour schemes."""

	def test_table_colours_emitted(self):
		from theme_iteslab.api import build_payload
		from theme_iteslab.presets import TABLE_COLOR_FIELDS, COLOR_VARIABLE_MAP

		payload = build_payload()
		for field in TABLE_COLOR_FIELDS:
			variable = COLOR_VARIABLE_MAP[field]
			self.assertIn(variable, payload["vars"], f"{variable} missing from light mode")
			self.assertIn(variable, payload["dark_vars"], f"{variable} missing from dark mode")

	def test_table_colours_are_rederived_for_dark(self):
		"""A pale header must not be carried into dark mode."""
		from theme_iteslab.api import build_payload
		from theme_iteslab.presets import DEFAULTS

		settings = DEFAULTS.copy()
		settings["table_header_background"] = "#FFFFFF"
		payload = build_payload(settings)

		self.assertEqual(payload["vars"]["--iteslab-table-header-bg"], "#FFFFFF")
		self.assertNotEqual(payload["dark_vars"]["--iteslab-table-header-bg"], "#FFFFFF")

	def test_dark_overrides_feed_derived_table_colours(self):
		from theme_iteslab.api import build_payload
		from theme_iteslab.presets import DEFAULTS

		settings = DEFAULTS.copy()
		settings["dark_border_color"] = "#2C3A4B"
		payload = build_payload(settings)

		self.assertEqual(payload["dark_vars"]["--iteslab-border"], "#2C3A4B")
		self.assertEqual(payload["dark_vars"]["--iteslab-table-border"], "#2C3A4B")

	def test_empty_dark_override_falls_back(self):
		from theme_iteslab.api import build_payload
		from theme_iteslab.presets import DARK_SURFACES, DEFAULTS

		settings = DEFAULTS.copy()
		settings["dark_background_color"] = ""
		payload = build_payload(settings)

		self.assertEqual(
			payload["dark_vars"]["--iteslab-background"], DARK_SURFACES["--iteslab-background"]
		)

	def test_class_driven_settings_are_in_the_payload(self):
		from theme_iteslab.api import build_payload
		from theme_iteslab.presets import DEFAULTS

		settings = DEFAULTS.copy()
		settings.update({"table_border_style": "All", "table_sticky_header": 1, "table_header_uppercase": 1})
		payload = build_payload(settings)

		self.assertEqual(payload["table_border_style"], "all")
		self.assertTrue(payload["table_sticky_header"])
		self.assertTrue(payload["table_header_uppercase"])

	def test_row_height_is_clamped(self):
		doc = frappe.get_single("Theme Settings")
		doc.table_row_height = 500
		doc.validate()
		self.assertLessEqual(doc.table_row_height, 64)

	def test_optional_dark_colour_may_be_empty(self):
		doc = frappe.get_single("Theme Settings")
		doc.dark_surface_color = ""
		doc.validate()
		self.assertEqual(doc.dark_surface_color, "")

	def test_optional_dark_colour_is_still_validated(self):
		doc = frappe.get_single("Theme Settings")
		doc.dark_surface_color = "nonsense"
		with self.assertRaises(frappe.ValidationError):
			doc.validate()
