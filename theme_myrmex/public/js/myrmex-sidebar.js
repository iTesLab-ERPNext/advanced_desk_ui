// Sidebar behaviour: brand block, collapse/expand, rail tooltips, mobile drawer.
//
// Nothing here re-parents or removes a Frappe node. The brand block is appended,
// labels are copied into a data attribute for the CSS tooltip, and state lives
// in classes on <html> plus localStorage.

const myrmex = window.myrmex;

const COLLAPSED_CLASS = "myrmex-sidebar-collapsed";
const OPEN_CLASS = "myrmex-sidebar-open";
const STORAGE_KEY = "sidebar-collapsed";

myrmex.sidebar = {
	init() {
		this.restoreState();
		this.mountOverlay();

		myrmex.onRoute(() => {
			const container = document.querySelector(".body-sidebar-container, .body-sidebar");
			if (!container) return;

			this.mountBrand(container);
			this.decorateItems(container);

			// The workspace list is re-rendered when workspaces are edited, and
			// Frappe emits no event for it. One scoped observer, dropped on the
			// next route change by myrmex.disconnectObservers().
			myrmex.observe(container, () => this.decorateItems(container));
		});

		// A tap inside the drawer should close it.
		document.addEventListener("click", (event) => {
			if (!myrmex.isMobile()) return;
			if (event.target.closest(".body-sidebar-container .item-anchor")) this.closeDrawer();
		});

		document.addEventListener("keydown", (event) => {
			if (event.key === "Escape") this.closeDrawer();
			// Ctrl/Cmd + B mirrors the convention people already know from IDEs.
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
				event.preventDefault();
				this.toggle();
			}
		});

		window.addEventListener("resize", () => {
			if (!myrmex.isMobile()) this.closeDrawer();
		});
	},

	restoreState() {
		const boot = frappe.boot && frappe.boot.myrmex_theme;
		const fallback = boot ? !!boot.collapse_sidebar_by_default : false;
		const collapsed = myrmex.storage.get(STORAGE_KEY, fallback);
		myrmex.ROOT.classList.toggle(COLLAPSED_CLASS, !!collapsed);
	},

	isCollapsed() {
		return myrmex.ROOT.classList.contains(COLLAPSED_CLASS);
	},

	/** On mobile the same control opens the drawer instead of collapsing. */
	toggle() {
		if (myrmex.isMobile()) {
			myrmex.ROOT.classList.toggle(OPEN_CLASS);
			return;
		}

		const collapsed = !this.isCollapsed();
		myrmex.ROOT.classList.toggle(COLLAPSED_CLASS, collapsed);
		myrmex.storage.set(STORAGE_KEY, collapsed);

		// Charts and datatables measure their container, so tell them it moved.
		window.dispatchEvent(new Event("resize"));
	},

	closeDrawer() {
		myrmex.ROOT.classList.remove(OPEN_CLASS);
	},

	mountOverlay() {
		if (document.querySelector(".myrmex-sidebar-overlay")) return;
		const overlay = document.createElement("div");
		overlay.className = "myrmex-sidebar-overlay";
		overlay.addEventListener("click", () => this.closeDrawer());
		document.body.appendChild(overlay);
	},

	mountBrand(container) {
		const host = container.querySelector(".body-sidebar") || container;
		myrmex.once(host, "Brand", () => {
			const brandText = (frappe.boot && frappe.boot.sysdefaults && frappe.boot.sysdefaults.app_name) || "Myrmex";
			const brand = document.createElement("div");
			brand.className = "myrmex-sidebar-brand";
			brand.innerHTML = `
				<span class="myrmex-mark">${frappe.utils.escape_html(brandText.charAt(0).toUpperCase())}</span>
				<span class="myrmex-wordmark">${frappe.utils.escape_html(brandText)}</span>
			`;
			host.prepend(brand);
		});
	},

	/**
	 * Copy each item's label into data-myrmex-label so the collapsed rail can
	 * show a CSS tooltip without inserting extra nodes into Frappe's tree.
	 */
	decorateItems(container) {
		container.querySelectorAll(".sidebar-item-container").forEach((item) => {
			const label = item.querySelector(".sidebar-item-label");
			const text = label ? label.textContent.trim() : "";
			if (text && item.dataset.myrmexLabel !== text) {
				item.dataset.myrmexLabel = text;
			}
		});
	},
};

myrmex.ready(() => myrmex.sidebar.init());

export default myrmex.sidebar;
