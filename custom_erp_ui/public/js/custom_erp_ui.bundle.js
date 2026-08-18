// Placeholder Frappe asset bundle.
//
// This file exists purely to give Frappe's esbuild-based asset pipeline a
// build entry point. Some bench/Frappe versions crash in
// `get_all_files_to_build` with "paths[0] must be of type string.
// Received undefined" when `bench build --app <app>` is run against an app
// that has zero *.bundle.js files anywhere under public/js.
//
// The actual dashboard UI does NOT depend on this bundle -- it's served as
// plain static assets (public/js/erp_dashboard.js, public/css/erp_dashboard.css)
// loaded directly via <script src>/<link> tags in www/erp_dashboard/index.html.
// This file just needs to exist and be valid JS.

frappe.provide("frappe.custom_erp_ui");
