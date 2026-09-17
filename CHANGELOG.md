# Changelog

## 1.1.0

### Added
- **Myrmex Assistant**: permission-aware AI chat panel for Desk users, with
  OpenAI-compatible, Azure OpenAI and Anthropic providers; server-side context
  built with the user's permissions; history, retention, rate limits, role and
  page rules; suggested prompts; English, French and Arabic with RTL.
- DocTypes: Chatbot Settings, Chatbot Suggestion, Chatbot Conversation,
  Chatbot Message. Daily retention job; conversations removed with their user.
- `myrmex-states` stylesheet: skeletons, empty and error states, freeze overlay.
- Expanded token set: type scale, weights, derived radii, status text and soft
  colours, focus ring, layers, easing.
- French and Arabic translation files.
- Unit and integration tests.

### Changed
- Sidebar rewritten for the actual v15 markup (`.layout-side-section >
  .desk-sidebar`): workspace sidebar as a panel, sentence-case section labels,
  nested guide lines, rail with floating tooltips, restyled native mobile drawer.
- Navbar: translucent bar with scroll elevation, rail toggle only where it
  applies, restyled notification panel.
- Forms follow v15's single-card layout, with the tab bar joined to the card.
- Lists render as one card (filters, table, paging) instead of a card in a card.
- Workspace widgets, number cards and link cards refined; hover lift only on
  clickable shortcuts.
- Workspace decorations run inside the visible page only.

### Fixed
- Selecting *Automatic* dark mode no longer leaves the page without a palette
  (`frappe.ui.set_theme` was given `"automatic"` as a theme name).
- Frappe's default `desk_theme` of "Light" is no longer treated as a user choice.
- Ctrl+B no longer overrides bold formatting in text fields and editors.
- Breadcrumb styles now target v15's `#navbar-breadcrumbs`.
