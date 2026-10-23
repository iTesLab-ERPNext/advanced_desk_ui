// Logout — made deterministic on both shells.
//
// WHY THIS EXISTS
// ---------------
// Frappe wires logout through an inline attribute on the menu item:
//
//   v15  <button class="btn-reset dropdown-item"
//                onclick="return frappe.app.logout()">Log out</button>
//        rendered into the navbar user dropdown (#toolbar-user).
//
//   v16  .dropdown-menu-item[data-name="logout"] in the sidebar header menu
//        (.sidebar-header-menu), whose handler also calls frappe.app.logout().
//
// frappe.app.logout() (desk.js in both versions) opens a frappe.confirm dialog
// and only then calls the `logout` endpoint and redirects. That chain has three
// links that break independently, and all three present the same way — you
// click "Log out" and nothing happens:
//
//   1. The inline onclick never runs. Any Content-Security-Policy without
//      'unsafe-inline' kills inline handlers. Menu items that are plain links
//      keep working, so only the action items (Log out, Toggle Theme, Reload)
//      look broken — a very common report on hardened v15 installs.
//   2. frappe.app is not an Application instance yet, or was replaced, so
//      `frappe.app.logout is not a function` is thrown from the attribute and
//      swallowed by the browser.
//   3. The confirm dialog opens but the navigation that follows is cancelled by
//      a beforeunload handler left behind by some other page.
//
// The fix does not patch Frappe. It claims the click in the capture phase,
// before the inline attribute can run, and performs the logout itself through
// the documented endpoint. If this module fails to load, the native path is
// untouched and still works.

const iteslab = window.iteslab;

iteslab.logout = {
	init() {
		if (this._bound) return;
		this._bound = true;

		// Capture phase: we see the click before the element's own inline
		// handler, so the outcome no longer depends on that attribute running.
		document.addEventListener("click", (event) => this.onClick(event), true);
	},

	/**
	 * Identify the logout control without reading its label.
	 *
	 * Matching on visible text would break in every non-English site, so each
	 * shell is matched on structure instead:
	 *   v16  data-name="logout" (set from the item's own `name`)
	 *   v15  an action item in #toolbar-user whose onclick names logout
	 * Plus [data-iteslab-logout] as an explicit opt-in for custom buttons.
	 */
	findControl(target) {
		if (!target || !target.closest) return null;

		const explicit = target.closest("[data-iteslab-logout]");
		if (explicit) return explicit;

		const v16Item = target.closest('.dropdown-menu-item[data-name="logout"]');
		if (v16Item) return v16Item;

		const v15Item = target.closest("#toolbar-user .dropdown-item, .dropdown-navbar-user .dropdown-item");
		if (v15Item) {
			const action = v15Item.getAttribute("onclick") || "";
			if (action.includes("logout")) return v15Item;
		}

		return null;
	},

	onClick(event) {
		const control = this.findControl(event.target);
		if (!control) return;

		// Stop the native chain: the inline onclick must not also fire, or the
		// confirm dialog would open twice.
		event.preventDefault();
		event.stopPropagation();
		if (event.stopImmediatePropagation) event.stopImmediatePropagation();

		this.closeMenus();
		this.confirm();
	},

	/** The menu stays open otherwise, because we stopped the click. */
	closeMenus() {
		document
			.querySelectorAll(".dropdown-navbar-user.show, .nav-item.dropdown.show")
			.forEach((el) => el.classList.remove("show"));
		document
			.querySelectorAll("#toolbar-user.show, .dropdown-menu.show")
			.forEach((el) => el.classList.remove("show"));

		const headerMenu = document.querySelector(".sidebar-header-menu");
		if (headerMenu) headerMenu.classList.add("hidden");
	},

	/** Translate if Frappe's helper is loaded, otherwise pass the string through. */
	t(text) {
		return typeof __ === "function" ? __(text) : text;
	},

	confirm() {
		const message = this.t("Are you sure you want to log out?");

		if (window.frappe && typeof frappe.confirm === "function") {
			frappe.confirm(message, () => this.perform());
			return;
		}

		// No dialog available (very early boot): fall back to the browser's.
		if (window.confirm(message)) this.perform();
	},

	/**
	 * Call the documented `logout` endpoint, then leave.
	 *
	 * The server clears the session record and expires the sid cookie; the
	 * redirect is a full page load rather than a router push, so no Desk state
	 * survives into the next session.
	 */
	perform() {
		const done = () => {
			this.clearClientState();
			this.redirect("/login");
		};

		if (!window.frappe || typeof frappe.call !== "function") {
			done();
			return;
		}

		frappe.call({
			method: "logout",
			freeze: true,
			freeze_message: this.t("Logging out..."),
			callback: (r) => {
				if (r && r.exc) {
					this.reportFailure();
					return;
				}
				done();
			},
			error: (xhr) => {
				// 401/403 means the session is already gone: that is a logout.
				if (xhr && (xhr.status === 401 || xhr.status === 403)) {
					done();
					return;
				}
				this.reportFailure();
			},
		});
	},

	/**
	 * Leave the Desk. A full document load, not a router push, so nothing from
	 * the authenticated session survives; replace() so Back cannot return to it.
	 * Isolated in one method so tests can observe it.
	 */
	redirect(url) {
		window.location.replace(url);
	},

	reportFailure() {
		const message = this.t("Could not log out. Check your connection and try again.");
		if (window.frappe && frappe.msgprint) {
			frappe.msgprint({ message, title: this.t("Logout failed"), indicator: "red" });
		} else {
			window.alert(message);
		}
	},

	/**
	 * Drop per-session client state so the next user on this browser does not
	 * inherit it.
	 *
	 * Deliberately narrow: sessionStorage is session-scoped and safe to wipe,
	 * and the few localStorage keys removed are the ones Frappe and this theme
	 * write per user. Everything else in localStorage (other apps' settings) is
	 * left alone — a blanket clear() would be a bug, not a security measure.
	 */
	clearClientState() {
		try {
			window.sessionStorage.clear();
		} catch (error) {
			// Private mode or blocked storage: nothing to clear.
		}

		const keys = ["session_last_route", "list_sidebar_stats", "iteslab:appearance-applied"];
		for (const key of keys) {
			try {
				window.localStorage.removeItem(key);
			} catch (error) {
				// Ignore: storage is a convenience, never a requirement.
			}
		}
	},
};

iteslab.ready(() => iteslab.logout.init());

export default iteslab.logout;
