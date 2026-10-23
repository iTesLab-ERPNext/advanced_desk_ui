// Which Desk are we in?
//
// The server already decided (theme_iteslab/compat.py) and sent the answer in
// frappe.boot.iteslab_theme.shell, so the normal path is a single property read.
// The DOM probe is only a fallback for a stale boot cache, and it keys off the
// one structural fact that separates the two shells: v15 renders a top navbar,
// v16 renders a .body-sidebar-container instead.

const iteslab = window.iteslab;

const boot = () => (window.frappe && frappe.boot && frappe.boot.iteslab_theme) || null;

iteslab.compat = {
	shell: "v15",
	major: 15,

	detect() {
		const payload = boot();

		if (payload && payload.shell) {
			this.shell = payload.shell;
			this.major = payload.frappe_major || (payload.shell === "v16" ? 16 : 15);
		} else if (document.querySelector(".body-sidebar-container")) {
			this.shell = "v16";
			this.major = 16;
		} else if (window.frappe && frappe.boot && frappe.boot.versions && frappe.boot.versions.frappe) {
			this.major = parseInt(String(frappe.boot.versions.frappe).split(".")[0], 10) || 15;
			this.shell = this.major >= 16 ? "v16" : "v15";
		}

		iteslab.ROOT.classList.add(`iteslab-${this.shell}`);
		iteslab.ROOT.dataset.iteslabShell = this.shell;
		return this.shell;
	},

	isV15() {
		return this.shell === "v15";
	},

	isV16() {
		return this.shell === "v16";
	},

	/** Where the sidebar lives in this shell. */
	sidebarRoot() {
		return this.isV16()
			? document.querySelector(".body-sidebar-container")
			: document.querySelector(".layout-side-section .list-sidebar, .layout-side-section");
	},

	/** The scrollable list of workspace items. */
	sidebarItemHost() {
		return this.isV16()
			? document.querySelector(".body-sidebar .sidebar-items")
			: document.querySelector(".desk-sidebar");
	},

	/**
	 * True when the shell provides its own collapse control, in which case the
	 * theme must not add a second one. v16 ships .collapse-sidebar-link.
	 */
	hasNativeCollapse() {
		return this.isV16();
	},
};

export default iteslab.compat;
