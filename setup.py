from setuptools import find_packages, setup

with open("requirements.txt") as f:
	install_requires = [line.strip() for line in f if line.strip()]

from aurora_theme import __version__ as version

setup(
	name="aurora_theme",
	version=version,
	description="A cool-toned, aurora-inspired ERPNext desk theme with animated workspace icons and a customer portal dashboard.",
	author="Your Company",
	author_email="dev@yourcompany.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires,
)
