"""Theme tokens, the field -> CSS variable map, and the shipped presets.

Everything the browser needs is derived from here, so adding a token means
touching exactly one file: add the field to the Theme Settings DocType, add the
mapping below, and use the variable in CSS.
"""

# Colour fields -> CSS custom property. These are re-emitted per colour scheme.
COLOR_VARIABLE_MAP = {
	"primary_color": "--myrmex-primary",
	"secondary_color": "--myrmex-secondary",
	"background_color": "--myrmex-background",
	"surface_color": "--myrmex-surface",
	"text_color": "--myrmex-text",
	"muted_text_color": "--myrmex-muted",
	"border_color": "--myrmex-border",
	"success_color": "--myrmex-success",
	"warning_color": "--myrmex-warning",
	"error_color": "--myrmex-error",
	"sidebar_background": "--myrmex-sidebar-background",
	"sidebar_text": "--myrmex-sidebar-text",
	"sidebar_active": "--myrmex-sidebar-active",
	"sidebar_hover": "--myrmex-sidebar-hover",
	"sidebar_icon": "--myrmex-sidebar-icon",
	"navbar_background": "--myrmex-navbar-background",
	"navbar_text": "--myrmex-navbar-text",
	"navbar_border": "--myrmex-navbar-border",
	"navbar_search_background": "--myrmex-navbar-search-background",
}

# Numeric fields -> CSS custom property. Emitted once, shared by both schemes.
SIZE_VARIABLE_MAP = {
	"sidebar_width": "--myrmex-sidebar-width",
	"navbar_height": "--myrmex-navbar-height",
	"card_radius": "--myrmex-card-radius",
	"button_radius": "--myrmex-button-radius",
	"input_radius": "--myrmex-input-radius",
	"card_padding": "--myrmex-card-padding",
}

SHADOWS = {
	"None": {
		"--myrmex-shadow": "none",
		"--myrmex-shadow-hover": "none",
		"--myrmex-shadow-lg": "none",
	},
	"Small": {
		"--myrmex-shadow": "0 1px 2px rgba(16, 24, 40, 0.06)",
		"--myrmex-shadow-hover": "0 2px 6px rgba(16, 24, 40, 0.10)",
		"--myrmex-shadow-lg": "0 6px 16px rgba(16, 24, 40, 0.12)",
	},
	"Medium": {
		"--myrmex-shadow": "0 1px 3px rgba(16, 24, 40, 0.08), 0 1px 2px rgba(16, 24, 40, 0.04)",
		"--myrmex-shadow-hover": "0 6px 16px rgba(16, 24, 40, 0.12)",
		"--myrmex-shadow-lg": "0 16px 40px rgba(16, 24, 40, 0.16)",
	},
	"Large": {
		"--myrmex-shadow": "0 4px 10px rgba(16, 24, 40, 0.10)",
		"--myrmex-shadow-hover": "0 10px 28px rgba(16, 24, 40, 0.16)",
		"--myrmex-shadow-lg": "0 24px 56px rgba(16, 24, 40, 0.22)",
	},
}

# Surfaces used when the Desk is in dark mode. Accent colours (primary,
# secondary, success, warning, error) are carried over from the user's palette,
# so a custom brand colour stays recognisable in dark mode.
DARK_SURFACES = {
	"--myrmex-background": "#0F1117",
	"--myrmex-surface": "#171A21",
	"--myrmex-surface-alt": "#1C202A",
	"--myrmex-text": "#E5E7EB",
	"--myrmex-muted": "#9AA3B2",
	"--myrmex-border": "#272D3A",
	"--myrmex-sidebar-background": "#12151C",
	"--myrmex-sidebar-text": "#D7DCE5",
	"--myrmex-sidebar-hover": "rgba(255, 255, 255, 0.06)",
	"--myrmex-navbar-background": "#12151C",
	"--myrmex-navbar-text": "#E5E7EB",
	"--myrmex-navbar-border": "#272D3A",
	"--myrmex-navbar-search-background": "#1C202A",
}

# The Myrmex Default palette doubles as the fallback for any empty field.
DEFAULTS = {
	"enable_theme": 1,
	"theme_preset": "Myrmex Default",
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
}


def _preset(**overrides):
	values = DEFAULTS.copy()
	values.update(overrides)
	return values


PRESETS = {
	"Myrmex Default": _preset(),
	"Myrmex Blue": _preset(
		theme_preset="Myrmex Blue",
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
	"Myrmex Dark": _preset(
		theme_preset="Myrmex Dark",
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
	"Myrmex Minimal": _preset(
		theme_preset="Myrmex Minimal",
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
	"Myrmex Enterprise": _preset(
		theme_preset="Myrmex Enterprise",
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
