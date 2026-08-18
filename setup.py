from setuptools import find_packages, setup

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

setup(
	name="custom_erp_ui",
	version="0.1.0",
	description="Modern dashboard UI layer for a custom Frappe/ERPNext app",
	author="Your Company",
	author_email="you@example.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires,
)
