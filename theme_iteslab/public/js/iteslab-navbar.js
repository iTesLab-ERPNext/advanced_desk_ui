// Navbar behaviour — v15 only.
//
// v16 has no top navbar: its navbar.html renders just the announcement widget
// and the shell moved into the sidebar, which brings its own collapse control.
// So this module returns immediately on v16 rather than hunting for elements
// that no longer exist.

const iteslab = window.iteslab;

iteslab.navbar = {
	init() {
		if (iteslab.compat.isV16()) return;

		iteslab.onRoute(() => {
			const navbar = document.querySelector("header.navbar, .navbar");
			if (!navbar) return;

			this.mountToggle(navbar);
			this.labelSearch(navbar);
		});

		this.trackScroll();
	},

	/** Prepend our own toggle; every native navbar control is left untouched. */
	mountToggle(navbar) {
		const host = navbar.querySelector(".container") || navbar;
		iteslab.once(host, "Toggle", () => {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "iteslab-nav-toggle";
			button.setAttribute("aria-label", __("Toggle sidebar"));
			button.setAttribute("title", `${__("Toggle sidebar")} (Ctrl+B)`);
			button.innerHTML = `
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
					stroke-linecap="round" aria-hidden="true">
					<line x1="3" y1="6" x2="21" y2="6"></line>
					<line x1="3" y1="12" x2="21" y2="12"></line>
					<line x1="3" y1="18" x2="21" y2="18"></line>
				</svg>
			`;
			button.addEventListener("click", () => iteslab.sidebar.toggle());
			host.prepend(button);
		});
	},

	labelSearch(navbar) {
		const input = navbar.querySelector("#navbar-search");
		if (!input) return;
		iteslab.once(input, "SearchLabel", () => {
			const isMac = navigator.platform.toUpperCase().includes("MAC");
			input.setAttribute("placeholder", `${__("Search")}  ${isMac ? "⌘" : "Ctrl+"}G`);
		});
	},

	/** Lift the navbar and page header once the content scrolls under them. */
	trackScroll() {
		if (this._scrollBound) return;
		this._scrollBound = true;

		let frame = null;
		const update = () => {
			frame = null;
			const scrolled = window.scrollY > 4;
			const navbar = document.querySelector("header.navbar, .navbar");
			const head = document.querySelector(".page-head");
			if (navbar) navbar.classList.toggle("iteslab-scrolled", scrolled);
			if (head) head.classList.toggle("iteslab-stuck", scrolled);
		};

		window.addEventListener(
			"scroll",
			() => {
				if (!frame) frame = requestAnimationFrame(update);
			},
			{ passive: true }
		);
	},
};

iteslab.ready(() => iteslab.navbar.init());

export default iteslab.navbar;
