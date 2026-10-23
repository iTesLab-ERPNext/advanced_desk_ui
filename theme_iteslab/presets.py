"""Theme tokens, the field -> CSS variable map, and the shipped presets.

Everything the browser needs is derived from here, so adding a token means
touching exactly one file: add the field to the Theme Settings DocType, add the
mapping below, and use the variable in CSS.
"""

# Colour fields -> CSS custom property. These are re-emitted per colour scheme.
COLOR_VARIABLE_MAP = {
	"primary_color": "--iteslab-primary",
	"secondary_color": "--iteslab-secondary",
	"background_color": "--iteslab-background",
	"surface_color": "--iteslab-surface",
	"text_color": "--iteslab-text",
	"muted_text_color": "--iteslab-muted",
	"border_color": "--iteslab-border",
	"success_color": "--iteslab-success",
	"warning_color": "--iteslab-warning",
	"error_color": "--iteslab-error",
	"sidebar_background": "--iteslab-sidebar-background",
	"sidebar_text": "--iteslab-sidebar-text",
	"sidebar_active": "--iteslab-sidebar-active",
	"sidebar_hover": "--iteslab-sidebar-hover",
	"sidebar_icon": "--iteslab-sidebar-icon",
	"navbar_background": "--iteslab-navbar-background",
	"navbar_text": "--iteslab-navbar-text",
	"navbar_border": "--iteslab-navbar-border",
	"navbar_search_background": "--iteslab-navbar-search-background",
	# Tables. Dark-mode equivalents are derived from the resolved dark surfaces
	# in api.build_payload, not carried over from these light values.
	"table_header_background": "--iteslab-table-header-bg",
	"table_header_text": "--iteslab-table-header-text",
	"table_border_color": "--iteslab-table-border",
	"table_row_hover": "--iteslab-table-row-hover",
	"table_stripe_color": "--iteslab-table-stripe",
}

# Table colours are re-derived for dark mode rather than inherited, so they are
# listed here to keep build_payload honest about which is which.
TABLE_COLOR_FIELDS = (
	"table_header_background",
	"table_header_text",
	"table_border_color",
	"table_row_hover",
	"table_stripe_color",
)

# Optional dark-mode overrides. Left empty, the derived DARK_SURFACES value is
# used; set, they replace it. This is what the Dark Mode tab edits.
DARK_OVERRIDE_MAP = {
	"dark_background_color": "--iteslab-background",
	"dark_surface_color": "--iteslab-surface",
	"dark_text_color": "--iteslab-text",
	"dark_border_color": "--iteslab-border",
}

# Numeric fields -> CSS custom property. Emitted once, shared by both schemes.
SIZE_VARIABLE_MAP = {
	"sidebar_width": "--iteslab-sidebar-width",
	"navbar_height": "--iteslab-navbar-height",
	"card_radius": "--iteslab-card-radius",
	"button_radius": "--iteslab-button-radius",
	"input_radius": "--iteslab-input-radius",
	"card_padding": "--iteslab-card-padding",
	"button_height": "--iteslab-button-height",
	"input_height": "--iteslab-input-height",
	"form_section_spacing": "--iteslab-form-section-gap",
	"table_row_height": "--iteslab-table-row-height",
	"table_cell_padding": "--iteslab-table-cell-padding",
	"table_header_font_size": "--iteslab-table-header-size",
}

# Emitted as-is rather than with a px suffix.
UNITLESS_VARIABLE_MAP = {
	"button_font_weight": "--iteslab-button-weight",
}

SHADOWS = {
	"None": {
		"--iteslab-shadow": "none",
		"--iteslab-shadow-hover": "none",
		"--iteslab-shadow-lg": "none",
	},
	"Small": {
		"--iteslab-shadow": "0 1px 2px rgba(16, 24, 40, 0.06)",
		"--iteslab-shadow-hover": "0 2px 6px rgba(16, 24, 40, 0.10)",
		"--iteslab-shadow-lg": "0 6px 16px rgba(16, 24, 40, 0.12)",
	},
	"Medium": {
		"--iteslab-shadow": "0 1px 3px rgba(16, 24, 40, 0.08), 0 1px 2px rgba(16, 24, 40, 0.04)",
		"--iteslab-shadow-hover": "0 6px 16px rgba(16, 24, 40, 0.12)",
		"--iteslab-shadow-lg": "0 16px 40px rgba(16, 24, 40, 0.16)",
	},
	"Large": {
		"--iteslab-shadow": "0 4px 10px rgba(16, 24, 40, 0.10)",
		"--iteslab-shadow-hover": "0 10px 28px rgba(16, 24, 40, 0.16)",
		"--iteslab-shadow-lg": "0 24px 56px rgba(16, 24, 40, 0.22)",
	},
}

# Surfaces used when the Desk is in dark mode. Accent colours (primary,
# secondary, success, warning, error) are carried over from the user's palette,
# so a custom brand colour stays recognisable in dark mode.
DARK_SURFACES = {
	"--iteslab-background": "#0F1117",
	"--iteslab-surface": "#171A21",
	"--iteslab-surface-alt": "#1C202A",
	"--iteslab-text": "#E5E7EB",
	"--iteslab-muted": "#9AA3B2",
	"--iteslab-border": "#272D3A",
	"--iteslab-sidebar-background": "#12151C",
	"--iteslab-sidebar-text": "#D7DCE5",
	"--iteslab-sidebar-hover": "rgba(255, 255, 255, 0.06)",
	"--iteslab-navbar-background": "#12151C",
	"--iteslab-navbar-text": "#E5E7EB",
	"--iteslab-navbar-border": "#272D3A",
	"--iteslab-navbar-search-background": "#1C202A",
}

# The ItesLab Default palette doubles as the fallback for any empty field.
DEFAULTS = {
	"enable_theme": 1,
	"theme_preset": "ItesLab Default",
	"default_appearance": "System",
	"density": "Comfortable",
	"enable_animations": 1,
	"zebra_tables": 0,
	"collapse_sidebar_by_default": 0,
	"primary_color": "#1DA1F2",
	"secondary_color": "#1426A9",
	"background_color": "#F7F7F9",
	"surface_color": "#FFFFFF",
	"text_color": "#111827",
	"muted_text_color": "#6B7280",
	"border_color": "#E5E7EB",
	"success_color": "#22C55E",
	"warning_color": "#F59E0B",
	"error_color": "#EF4444",
	"sidebar_background": "#FFFFFF",
	"sidebar_text": "#111827",
	"sidebar_active": "#1DA1F2",
	"sidebar_hover": "#F1F5F9",
	"sidebar_icon": "#6B7280",
	"navbar_background": "#FFFFFF",
	"navbar_text": "#111827",
	"navbar_border": "#E5E7EB",
	"navbar_search_background": "#F3F4F6",
	"sidebar_width": 260,
	"navbar_height": 60,
	"card_radius": 14,
	"button_radius": 8,
	"input_radius": 8,
	"card_padding": 20,
	"shadow_size": "Medium",
	# Buttons
	"button_height": 32,
	"button_font_weight": "500",
	# Forms
	"input_height": 32,
	"form_section_spacing": 16,
	# Tables
	"table_header_background": "#FBFBFC",
	"table_header_text": "#6B7280",
	"table_border_color": "#E5E7EB",
	"table_row_hover": "#F7F7F9",
	"table_stripe_color": "#FAFAFB",
	"table_row_height": 42,
	"table_cell_padding": 12,
	"table_header_font_size": 12,
	"table_border_style": "Horizontal",
	"table_sticky_header": 1,
	"table_header_uppercase": 0,
	# Dark mode overrides (empty = derive from the palette)
	"dark_background_color": "",
	"dark_surface_color": "",
	"dark_text_color": "",
	"dark_border_color": "",
}


def _preset(**overrides):
	values = DEFAULTS.copy()
	values.update(overrides)
	return values


PRESETS = {
	"ItesLab Default": _preset(),
	"ItesLab Blue": _preset(
		theme_preset="ItesLab Blue",
		table_header_background="#EEF3FF",
		table_header_text="#2563EB",
		table_row_hover="#F5F8FF",
		table_stripe_color="#FAFCFF",
		primary_color="#2563EB",
		secondary_color="#1E3A8A",
		background_color="#F4F7FE",
		sidebar_background="#FFFFFF",
		sidebar_active="#2563EB",
		sidebar_hover="#EEF3FF",
		navbar_search_background="#EEF3FF",
		card_radius=16,
		button_radius=10,
		input_radius=10,
	),
	"ItesLab Dark": _preset(
		theme_preset="ItesLab Dark",
		table_header_background="#1C202A",
		table_header_text="#9AA3B2",
		table_border_color="#272D3A",
		table_row_hover="#1C202A",
		table_stripe_color="#191D26",
		default_appearance="Dark",
		primary_color="#38BDF8",
		secondary_color="#818CF8",
		background_color="#0F1117",
		surface_color="#171A21",
		text_color="#E5E7EB",
		muted_text_color="#9AA3B2",
		border_color="#272D3A",
		sidebar_background="#12151C",
		sidebar_text="#D7DCE5",
		sidebar_active="#38BDF8",
		sidebar_hover="#1C202A",
		sidebar_icon="#9AA3B2",
		navbar_background="#12151C",
		navbar_text="#E5E7EB",
		navbar_border="#272D3A",
		navbar_search_background="#1C202A",
	),
	"ItesLab Minimal": _preset(
		theme_preset="ItesLab Minimal",
		table_header_background="#FFFFFF",
		table_header_text="#111827",
		table_border_color="#E7E7E9",
		table_row_hover="#F4F4F5",
		table_border_style="Horizontal",
		table_row_height=36,
		table_cell_padding=8,
		button_height=30,
		input_height=30,
		form_section_spacing=12,
		primary_color="#111827",
		secondary_color="#374151",
		background_color="#FFFFFF",
		surface_color="#FFFFFF",
		border_color="#E7E7E9",
		sidebar_background="#FFFFFF",
		sidebar_active="#111827",
		sidebar_hover="#F4F4F5",
		navbar_search_background="#F4F4F5",
		card_radius=8,
		button_radius=6,
		input_radius=6,
		card_padding=16,
		shadow_size="None",
		density="Compact",
	),
	"ItesLab Enterprise": _preset(
		theme_preset="ItesLab Enterprise",
		table_header_background="#F2F4F8",
		table_header_text="#4D5358",
		table_border_color="#DDE1E6",
		table_row_hover="#EDF1F7",
		table_stripe_color="#F8F9FB",
		table_border_style="All",
		table_header_uppercase=1,
		zebra_tables=1,
		button_font_weight="600",
		primary_color="#0F62FE",
		secondary_color="#0043CE",
		background_color="#F2F4F8",
		text_color="#161616",
		border_color="#DDE1E6",
		sidebar_background="#161C2D",
		sidebar_text="#C9D1E4",
		sidebar_active="#0F62FE",
		sidebar_hover="#212942",
		sidebar_icon="#8D97B0",
		navbar_background="#FFFFFF",
		navbar_search_background="#F2F4F8",
		card_radius=10,
		button_radius=6,
		input_radius=6,
		shadow_size="Small",
	),
}

PRESET_NAMES = list(PRESETS.keys())
