from setuptools import find_packages, setup

# NOTE: deliberately not declaring "frappe" as an install_requires here.
# Frappe is always already present in the bench's Python environment, and
# listing it explicitly makes some installers (uv in particular) try to
# fully re-resolve Frappe's own dependency tree -- which fails because
# Frappe's pyproject.toml pins pypika via a git URL, and uv's strict
# resolver rejects transitive URL/git dependencies unless the *consuming*
# project (this app) lists them directly too. Leaving this empty avoids
# that resolution entirely.
setup(
	name="custom_erp_ui",
	version="0.1.0",
	description="Modern dashboard UI layer for a custom Frappe/ERPNext app",
	author="Your Company",
	author_email="you@example.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=[],
)
