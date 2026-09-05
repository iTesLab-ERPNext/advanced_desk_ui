"""Deliver the theme with the page instead of after it."""

import frappe

from theme_myrmex.api import get_theme_payload


def boot_session(bootinfo):
	"""extend_bootinfo hook: attach the palette to frappe.boot."""
	try:
		bootinfo.myrmex_theme = get_theme_payload()
	except Exception:
		# A broken theme must never block the Desk from booting.
		frappe.log_error(title="Theme Myrmex: bootinfo failed")


def update_website_context(context):
	"""Make the palette available to portal and login templates."""
	try:
		context.myrmex_theme = get_theme_payload()
	except Exception:
		context.myrmex_theme = None
	return context
