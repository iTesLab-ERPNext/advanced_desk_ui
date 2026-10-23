// Sidebar behaviour.
//
// The two shells need opposite treatment:
//
//   v15  has no collapse control and no drawer, so the theme supplies both,
//        plus a brand block and rail tooltips. State lives in classes on <html>
//        and in localStorage.
//
//   v16  already collapses (.collapse-sidebar-link), already has a resize
//        handle, its own mobile overlay and its own tooltips. Adding ours would
//        mean two controls fighting over one width, so on v16 this module only
//        forwards toggle() to the native button and stays out of the way.

const iteslab = window.iteslab;

const COLLAPSED_CLASS = "iteslab-sidebar-collapsed";
const OPEN_CLASS = "iteslab-sidebar-open";
const STORAGE_KEY = "sidebar-collapsed";

iteslab.sidebar = {
	init() {
		if (iteslab.compat.isV16()) {
			this.initV16();
			return;
		}
		this.initV15();
	},

	// --- v16: defer to the shell ------------------------------------------

	initV16() {
		// Nothing to mount. The native control owns the width, and the items
		// already carry data-toggle="tooltip".
	},

	// --- v15: the theme supplies the behaviour ----------------------------

	initV15() {
		this.restoreState();
		this.mountOverlay();

		iteslab.onRoute(() => {
			const host = iteslab.compat.sidebarItemHost();
			if (!host) return;

			this.mountBrand(host);
			this.decorateItems(host);

			// The workspace list is re-rendered when workspaces are edited and
			// Frappe emits no event for it. One scoped observer, dropped on the
			// next route change by iteslab.disconnectObservers().
			iteslab.observe(host, () => this.decorateItems(host));
		});

		// A tap inside the drawer should close it.
		document.addEventListener("click", (event) => {
			if (!iteslab.isMobile()) return;
			if (event.target.closest && event.target.closest(".sidebar-item-container .item-anchor")) {
				this.closeDrawer();
			}
		});

		document.addEventListener("keydown", (event) => {
			if (!event.key) return;
			if (event.key === "Escape") this.closeDrawer();
			// Ctrl/Cmd + B mirrors the convention people know from editors.
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
				event.preventDefault();
				this.toggle();
			}
		});

		window.addEventListener("resize", () => {
			if (!iteslab.isMobile()) this.closeDrawer();
		});
	},

	restoreState() {
		const payload = (window.frappe && frappe.boot && frappe.boot.iteslab_theme) || null;
		const fallback = payload ? !!payload.collapse_sidebar_by_default : false;
		const collapsed = iteslab.storage.get(STORAGE_KEY, fallback);
		iteslab.ROOT.classList.toggle(COLLAPSED_CLASS, !!collapsed);
	},

	isCollapsed() {
		return iteslab.ROOT.classList.contains(COLLAPSED_CLASS);
	},

	/**
	 * On v16 this clicks the shell's own button, so there is exactly one source
	 * of truth for the sidebar width. On v15 it drives our classes.
	 */
	toggle() {
		if (iteslab.compat.isV16()) {
			const native = document.querySelector(".collapse-sidebar-link, .sidebar-toggle-btn");
			if (native) native.click();
			return;
		}

		if (iteslab.isMobile()) {
			iteslab.ROOT.classList.toggle(OPEN_CLASS);
			return;
		}

		const collapsed = !this.isCollapsed();
		iteslab.ROOT.classList.toggle(COLLAPSED_CLASS, collapsed);
		iteslab.storage.set(STORAGE_KEY, collapsed);

		// Charts and datatables measure their container, so tell them it moved.
		window.dispatchEvent(new Event("resize"));
	},

	closeDrawer() {
		iteslab.ROOT.classList.remove(OPEN_CLASS);
	},

	mountOverlay() {
		if (document.querySelector(".iteslab-sidebar-overlay")) return;
		const overlay = document.createElement("div");
		overlay.className = "iteslab-sidebar-overlay";
		overlay.addEventListener("click", () => this.closeDrawer());
		document.body.appendChild(overlay);
	},

	mountBrand(host) {
		iteslab.once(host, "Brand", () => {
			const label =
				(window.frappe && frappe.boot && frappe.boot.sysdefaults && frappe.boot.sysdefaults.app_name) ||
				"ItesLab";
			const safe = frappe.utils.escape_html(label);
			const brand = document.createElement("div");
			brand.className = "iteslab-sidebar-brand";
			brand.innerHTML = `
				<span class="iteslab-mark">${frappe.utils.escape_html(label.charAt(0).toUpperCase())}</span>
				<span class="iteslab-wordmark">${safe}</span>
			`;
			host.prepend(brand);
		});
	},

	/**
	 * Copy each item's label into data-iteslab-label so the collapsed rail can
	 * show a CSS tooltip without inserting extra nodes into Frappe's tree.
	 */
	decorateItems(host) {
		host.querySelectorAll(".sidebar-item-container").forEach((item) => {
			const label = item.querySelector(".sidebar-item-label");
			const text = label ? label.textContent.trim() : "";
			if (text && item.dataset.iteslabLabel !== text) {
				item.dataset.iteslabLabel = text;
			}
		});
	},
};

iteslab.ready(() => iteslab.sidebar.init());

export default iteslab.sidebar;
