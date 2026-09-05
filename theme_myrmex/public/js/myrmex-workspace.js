// Workspace, list and form touches that CSS alone cannot reach.
//
// Every hook here is additive: a class, a data attribute, a wrapper around a
// table. No widget is removed, no permission-controlled element is created, and
// nothing is rendered that Frappe did not already render.

const myrmex = window.myrmex;

myrmex.workspace = {
	init() {
		myrmex.onRoute((route) => {
			const view = (route && route[0]) || "";

			if (view === "Workspaces" || view === "" || view === "workspace") {
				this.decorateWorkspace();
			}

			if (view === "List") this.decorateList();
			if (view === "Form") this.decorateForm();
		});
	},

	decorateWorkspace() {
		const main = document.querySelector(".layout-main-section");
		if (!main) return;

		const tag = () => {
			main.querySelectorAll(".widget").forEach((widget) => {
				widget.classList.add("myrmex-card");
			});
		};

		// Workspace widgets stream in as their data resolves, and editing the
		// workspace re-renders them. Scoped observer, dropped on route change.
		myrmex.observe(main, tag);
	},

	decorateList() {
		const container = document.querySelector(".layout-main-section");
		if (!container) return;

		myrmex.observe(container, () => {
			// Give wide tables their own scroll context instead of letting them
			// push the page sideways.
			container.querySelectorAll("table.table").forEach((table) => {
				myrmex.once(table, "Scroll", () => {
					if (table.closest(".myrmex-table-wrapper")) return;
					const wrapper = document.createElement("div");
					wrapper.className = "myrmex-table-wrapper";
					table.parentNode.insertBefore(wrapper, table);
					wrapper.appendChild(table);
				});
			});
		});
	},

	decorateForm() {
		const form = document.querySelector(".form-page");
		if (!form) return;

		myrmex.observe(form, () => {
			form.querySelectorAll(".form-section").forEach((section) => {
				const head = section.querySelector(".section-head");
				if (head) section.dataset.myrmexSection = head.textContent.trim().slice(0, 60);
			});
		});
	},
};

myrmex.ready(() => myrmex.workspace.init());

export default myrmex.workspace;
