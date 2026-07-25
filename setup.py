from setuptools import find_packages, setup

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in advanced_desk_ui/__init__.py
from advanced_desk_ui import __version__ as version

setup(
	name="advanced_desk_ui",
	version=version,
	description="Modern SaaS-style Desk theme and UX layer for ERPNext v15+",
	author="Your Company",
	author_email="dev@yourcompany.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires,
)
