(function () {
	"use strict";

	const shell = document.getElementById("erpShell");

	/* ================= Sidebar collapse/expand ================= */
	const collapseBtn = document.getElementById("erpCollapseBtn");
	const sidebarToggle = document.getElementById("erpSidebarToggle");
	const COLLAPSE_KEY = "erp_sidebar_collapsed";

	function applyCollapsedState() {
		const collapsed = window.localStorage.getItem(COLLAPSE_KEY) === "1";
		shell.classList.toggle("erp-collapsed", collapsed);
	}
	applyCollapsedState();

	collapseBtn?.addEventListener("click", () => {
		const collapsed = shell.classList.toggle("erp-collapsed");
		window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
	});

	// On mobile, the menu button opens/closes an overlay sidebar instead.
	sidebarToggle?.addEventListener("click", () => {
		if (window.innerWidth <= 900) {
			shell.classList.toggle("erp-mobile-open");
		} else {
			collapseBtn.click();
		}
	});

	/* ================= Active nav highlighting ================= */
	document.querySelectorAll(".erp-nav-item").forEach((link) => {
		if (link.getAttribute("href") === window.location.pathname) {
			link.classList.add("active");
		}
	});

	/* ================= Dropdowns (notifications, user menu) ================= */
	function setupDropdown(triggerEl, panelEl) {
		if (!triggerEl || !panelEl) return;
		triggerEl.addEventListener("click", (e) => {
			e.stopPropagation();
			const isOpen = !panelEl.hidden;
			closeAllDropdowns();
			panelEl.hidden = isOpen;
		});
	}
	function closeAllDropdowns() {
		document.querySelectorAll(".erp-dropdown-panel").forEach((p) => (p.hidden = true));
	}
	document.addEventListener("click", closeAllDropdowns);

	setupDropdown(document.getElementById("erpUserTrigger"), document.getElementById("erpUserPanel"));
	setupDropdown(document.getElementById("erpNotifBtn"), document.getElementById("erpNotifPanel"));

	/* ================= Toasts ================= */
	function showToast(message, type = "info") {
		const container = document.getElementById("erpToastContainer");
		const icons = { success: "check-circle", error: "close-circle", warning: "alert", info: "information" };
		const el = document.createElement("div");
		el.className = `erp-toast erp-toast-${type}`;
		el.innerHTML = `<span class="mdi mdi-${icons[type] || icons.info}"></span><span>${message}</span>`;
		container.appendChild(el);
		setTimeout(() => el.remove(), 4000);
	}
	window.erpShowToast = showToast;

	/* ================= Helpers ================= */
	function formatCurrency(value) {
		return (
			new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.round(value)) +
			" DT"
		);
	}
	function formatNumber(value) {
		return new Intl.NumberFormat().format(value);
	}
	function timeAgo(dateStr) {
		const diffMs = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diffMs / 60000);
		if (mins < 1) return "just now";
		if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
		const days = Math.floor(hrs / 24);
		return `${days} day${days === 1 ? "" : "s"} ago`;
	}

	async function callApi(method, args = {}) {
		const params = new URLSearchParams(args).toString();
		const url = `/api/method/custom_erp_ui.api.dashboard.${method}${params ? "?" + params : ""}`;
		const res = await fetch(url, {
			headers: { "X-Frappe-CSRF-Token": window.frappe?.csrf_token || "" },
		});
		if (!res.ok) throw new Error(`API ${method} failed with ${res.status}`);
		const data = await res.json();
		return data.message;
	}

	/* ================= KPI cards ================= */
	const KPI_META = {
		customers: { fallbackIcon: "account-group" },
		sales_orders: { fallbackIcon: "clipboard-text" },
		invoices: { fallbackIcon: "file-document" },
		payments: { fallbackIcon: "cash" },
		stock_value: { fallbackIcon: "warehouse" },
	};

	function renderKpis(kpis) {
		const grid = document.getElementById("erpKpiGrid");
		if (!kpis || !kpis.length) {
			grid.innerHTML = `
				<div class="erp-empty-state" style="grid-column: 1 / -1;">
					<span class="mdi mdi-chart-box-outline"></span>
					<h3>No data yet</h3>
					<p>KPIs will appear once you have records in the system.</p>
				</div>`;
			return;
		}
		grid.innerHTML = kpis
			.map((kpi) => {
				const trendUp = kpi.trend >= 0;
				const displayValue = kpi.is_currency ? formatCurrency(kpi.value) : formatNumber(kpi.value);
				return `
				<div class="erp-kpi-card">
					<div class="erp-kpi-top">
						<div class="erp-kpi-icon accent-${kpi.accent}">
							<span class="mdi mdi-${kpi.icon}"></span>
						</div>
						<div class="erp-kpi-label">${kpi.label}</div>
					</div>
					<div>
						<div class="erp-kpi-value">${displayValue}</div>
						<div class="erp-kpi-trend ${trendUp ? "up" : "down"}">
							<span class="mdi mdi-arrow-${trendUp ? "up" : "down"}"></span>
							${Math.abs(kpi.trend)}%
							<span class="erp-kpi-trend-note">this month</span>
						</div>
					</div>
				</div>`;
			})
			.join("");
	}

	/* ================= Quick actions ================= */
	const QUICK_ACTIONS = [
		{ title: "New Customer", desc: "Add a customer", icon: "account-plus", route: "/app/customer/new" },
		{ title: "New Sales Order", desc: "Create an order", icon: "cart-plus", route: "/app/sales-order/new" },
		{ title: "New Invoice", desc: "Create invoice", icon: "file-document-plus", route: "/app/sales-invoice/new" },
		{ title: "New Payment", desc: "Record payment", icon: "cash-plus", route: "/app/payment-entry/new" },
		{ title: "New Item", desc: "Add an item", icon: "package-variant-closed", route: "/app/item/new" },
		{ title: "Stock Entry", desc: "Move stock", icon: "swap-horizontal", route: "/app/stock-entry/new" },
	];

	function renderQuickActions() {
		const wrap = document.getElementById("erpQuickActions");
		wrap.innerHTML = QUICK_ACTIONS.map(
			(a) => `
			<a class="erp-quick-action-card" href="${a.route}">
				<div class="erp-quick-action-icon"><span class="mdi mdi-${a.icon}"></span></div>
				<div class="erp-quick-action-title">${a.title}</div>
				<div class="erp-quick-action-desc">${a.desc}</div>
			</a>`
		).join("");
	}

	/* ================= Recent activity ================= */
	const STATUS_COLOR = {
		Submitted: "var(--erp-success)",
		Draft: "var(--erp-text-muted)",
		Cancelled: "var(--erp-danger)",
	};

	function renderActivity(items) {
		const list = document.getElementById("erpActivityList");
		if (!items || !items.length) {
			list.innerHTML = `
				<div class="erp-empty-state">
					<span class="mdi mdi-timeline-outline"></span>
					<h3>No recent activity</h3>
					<p>Activity will show up here as records are created.</p>
				</div>`;
			return;
		}
		list.innerHTML = items
			.map(
				(item) => `
				<div class="erp-activity-item">
					<span class="erp-activity-dot" style="background:${STATUS_COLOR[item.status] || "var(--erp-info)"}"></span>
					<div>
						<div class="erp-activity-title">${item.doctype} <strong>${item.name}</strong> ${item.status.toLowerCase()}</div>
						<div class="erp-activity-time">${timeAgo(item.timestamp)}</div>
					</div>
				</div>`
			)
			.join("");
	}

	/* ================= Sales chart ================= */
	function renderSalesChart(data) {
		const canvas = document.getElementById("erpSalesChart");
		if (!data || !data.labels || !data.labels.length) {
			canvas.replaceWith(Object.assign(document.createElement("div"), {
				className: "erp-empty-state",
				innerHTML: `<span class="mdi mdi-chart-line"></span><h3>No sales data</h3>`,
			}));
			return;
		}
		if (typeof Chart === "undefined") return;
		new Chart(canvas, {
			type: "line",
			data: {
				labels: data.labels,
				datasets: [
					{
						label: "Sales",
						data: data.values,
						borderColor: "#2563EB",
						backgroundColor: "rgba(37, 99, 235, 0.08)",
						fill: true,
						tension: 0.35,
						pointRadius: 3,
						pointBackgroundColor: "#2563EB",
					},
				],
			},
			options: {
				responsive: true,
				plugins: { legend: { display: false } },
				scales: {
					y: { beginAtZero: true, grid: { color: "#E2E8F0" } },
					x: { grid: { display: false } },
				},
			},
		});
	}

	/* ================= Order status breakdown ================= */
	const STATUS_SWATCH = {
		Completed: "#16A34A",
		Closed: "#16A34A",
		Pending: "#F97316",
		"To Deliver and Bill": "#F97316",
		Cancelled: "#DC2626",
		Draft: "#94A3B8",
	};

	function renderStatusBreakdown(data) {
		const wrap = document.getElementById("erpStatusBreakdown");
		if (!data || !data.labels || !data.labels.length) {
			wrap.innerHTML = `
				<div class="erp-empty-state">
					<span class="mdi mdi-chart-donut"></span>
					<h3>No orders yet</h3>
				</div>`;
			return;
		}
		const total = data.values.reduce((a, b) => a + b, 0) || 1;
		wrap.innerHTML = data.labels
			.map((label, i) => {
				const value = data.values[i];
				const pct = Math.round((value / total) * 100);
				const color = STATUS_SWATCH[label] || "#0EA5E9";
				return `
				<div class="erp-status-row">
					<div class="erp-status-row-left">
						<span class="erp-status-swatch" style="background:${color}"></span>
						<span>${label}</span>
					</div>
					<span><strong>${value}</strong> <span style="color:var(--erp-text-muted)">(${pct}%)</span></span>
				</div>`;
			})
			.join("");
	}

	/* ================= Global search (debounced) ================= */
	const searchInput = document.getElementById("erpGlobalSearch");
	const searchResults = document.getElementById("erpSearchResults");
	let searchTimer = null;

	searchInput?.addEventListener("input", (e) => {
		const query = e.target.value.trim();
		clearTimeout(searchTimer);
		if (!query) {
			searchResults.innerHTML = "";
			return;
		}
		searchTimer = setTimeout(() => runSearch(query), 300);
	});

	async function runSearch(query) {
		try {
			const url = `/api/method/frappe.desk.search.search_link?txt=${encodeURIComponent(
				query
			)}&doctype=Customer`;
			const res = await fetch(url, { headers: { "X-Frappe-CSRF-Token": window.frappe?.csrf_token || "" } });
			if (!res.ok) throw new Error("search failed");
			const data = await res.json();
			const results = data.message || [];
			if (!results.length) {
				searchResults.innerHTML = `<div class="erp-empty-state" style="padding:20px;">No results for "${query}"</div>`;
				return;
			}
			searchResults.innerHTML = `
				<div class="erp-nav-section-label" style="padding:6px 8px;">Customers</div>
				${results
					.map(
						(r) => `<a class="erp-dropdown-item" href="/app/customer/${encodeURIComponent(r.value)}">${r.label || r.value}</a>`
					)
					.join("")}`;
		} catch (err) {
			searchResults.innerHTML = "";
		}
	}

	document.addEventListener("click", (e) => {
		if (!e.target.closest(".erp-search")) searchResults.innerHTML = "";
	});

	/* ================= Boot ================= */
	async function boot() {
		renderQuickActions();

		try {
			const kpis = await callApi("get_kpis");
			renderKpis(kpis);
		} catch (err) {
			document.getElementById("erpKpiGrid").innerHTML = `
				<div class="erp-error-state" style="grid-column: 1 / -1;">
					<span class="mdi mdi-alert-circle-outline"></span>
					<h3>Something went wrong</h3>
					<p>We couldn't load the KPIs.</p>
				</div>`;
		}

		try {
			const activity = await callApi("get_recent_activity", { limit: 8 });
			renderActivity(activity);
		} catch (err) {
			renderActivity([]);
		}

		try {
			const salesData = await callApi("get_sales_chart", { months: 6 });
			renderSalesChart(salesData);
		} catch (err) {
			renderSalesChart(null);
		}

		try {
			const statusData = await callApi("get_order_status_breakdown");
			renderStatusBreakdown(statusData);
		} catch (err) {
			renderStatusBreakdown(null);
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", boot);
	} else {
		boot();
	}
})();
