// Shared plumbing: the namespace, route hooks, and a disciplined observer.
//
// Frappe rebuilds large parts of the DOM on every route change, so the theme
// needs to re-attach. It does that by listening to Frappe's own events. Timed
// guesses (setTimeout polling) are not used anywhere in this app.

const iteslab = (window.iteslab = window.iteslab || {});

iteslab.version = "1.0.0";
iteslab.ROOT = document.documentElement;

// --- one-time guards -------------------------------------------------------

/**
 * Run `fn` against `element` only once, ever. The marker lives on the element,
 * so a re-rendered node is treated as new and a surviving node is skipped.
 */
iteslab.once = function (element, key, fn) {
	if (!element) return false;
	const flag = `iteslab${key}`;
	if (element.dataset[flag]) return false;
	element.dataset[flag] = "1";
	fn(element);
	return true;
};

// --- route handling --------------------------------------------------------

const routeHandlers = [];

/**
 * Register a callback for "the page just changed". Fires on the initial load
 * and on every subsequent Desk navigation.
 */
iteslab.onRoute = function (fn) {
	routeHandlers.push(fn);
	if (iteslab._booted) safely(fn);
};

function safely(fn) {
	try {
		fn(frappe.get_route ? frappe.get_route() : []);
	} catch (error) {
		console.error("[iteslab] handler failed", error);
	}
}

function runRouteHandlers() {
	routeHandlers.forEach(safely);
}

iteslab.bindRouting = function () {
	if (iteslab._routingBound) return;
	iteslab._routingBound = true;

	// frappe.router is the canonical signal in v15.
	if (frappe.router && frappe.router.on) {
		frappe.router.on("change", () => {
			disconnectScoped();
			runRouteHandlers();
		});
	}

	// page-change covers the cases the router does not emit for (first paint of
	// a page object, workspace switches inside the same route).
	$(document).on("page-change", () => {
		disconnectScoped();
		runRouteHandlers();
	});

	$(document).on("form-refresh list-view-refresh", () => runRouteHandlers());
};

// --- scoped mutation observers --------------------------------------------

const scopedObservers = [];

/**
 * Observe one container, not the document.
 *
 * The callback is throttled to one animation frame, the observer is registered
 * so it can be disconnected on the next route change, and re-observing the same
 * node is a no-op. Use this only where Frappe gives no event to hook.
 */
iteslab.observe = function (target, callback, options) {
	if (!target || target.dataset.iteslabObserved) return null;
	target.dataset.iteslabObserved = "1";

	let frame = null;
	const observer = new MutationObserver(() => {
		if (frame) return;
		frame = requestAnimationFrame(() => {
			frame = null;
			try {
				callback(target);
			} catch (error) {
				console.error("[iteslab] observer callback failed", error);
			}
		});
	});

	observer.observe(target, Object.assign({ childList: true, subtree: true }, options || {}));
	scopedObservers.push({ observer, target });
	callback(target);
	return observer;
};

function disconnectScoped() {
	while (scopedObservers.length) {
		const entry = scopedObservers.pop();
		entry.observer.disconnect();
		if (entry.target) delete entry.target.dataset.iteslabObserved;
	}
}

iteslab.disconnectObservers = disconnectScoped;

// Leaving the tab or the app should not leave observers running.
window.addEventListener("beforeunload", disconnectScoped);

// --- small helpers ---------------------------------------------------------

iteslab.storage = {
	get(key, fallback) {
		try {
			const value = window.localStorage.getItem(`iteslab:${key}`);
			return value === null ? fallback : JSON.parse(value);
		} catch (error) {
			return fallback;
		}
	},
	set(key, value) {
		try {
			window.localStorage.setItem(`iteslab:${key}`, JSON.stringify(value));
		} catch (error) {
			// Private browsing or a full quota: state simply does not persist.
		}
	},
};

iteslab.isMobile = () => window.matchMedia("(max-width: 991px)").matches;

iteslab.ready = function (fn) {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", fn, { once: true });
	} else {
		fn();
	}
};

export default iteslab;
