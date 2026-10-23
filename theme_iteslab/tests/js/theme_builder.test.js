// Static checks on the Theme Builder's tab definition.
//
// The builder renders each field from the GROUPS table, and the DocType stores
// them. Those two lists drifting apart is the failure mode this catches: a tab
// that edits a field the DocType does not have (silently dropped on save), a
// stored setting no tab can reach (invisible to users — this is how the Tables
// section went missing), or one field in two tabs (two controls, one value,
// they desync as soon as you touch either).

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../..");
const BUILDER = path.join(ROOT, "iteslab/page/theme_builder/theme_builder.js");
const DOCTYPE = path.join(ROOT, "iteslab/doctype/theme_settings/theme_settings.json");

// The ten sections the brief asks for (§17).
const REQUIRED_TABS = [
	"General", "Colours", "Sidebar", "Navbar", "Cards",
	"Buttons", "Forms", "Tables", "Dark Mode", "Advanced",
];

let failures = 0;
const check = (name, cond, detail) => {
	console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond || !detail ? "" : ` → ${detail}`}`);
	if (!cond) failures++;
};

// Evaluate just the GROUPS literal, with __ stubbed as identity.
const source = fs.readFileSync(BUILDER, "utf8");
const literal = source.slice(source.indexOf("const GROUPS = ["), source.indexOf("class ThemeBuilder {"));
const GROUPS = new Function("__", `${literal} return GROUPS;`)((s) => s);

const doc = JSON.parse(fs.readFileSync(DOCTYPE, "utf8"));
const storedFields = new Map(doc.fields.map((f) => [f.fieldname, f]));
const layoutTypes = new Set(["Section Break", "Column Break"]);
const editable = new Set(
	doc.fields.filter((f) => !layoutTypes.has(f.fieldtype)).map((f) => f.fieldname)
);

// 1. Every tab the brief asks for is present, in order.
const labels = GROUPS.map((g) => g.label);
check(`builder has all ${REQUIRED_TABS.length} tabs from the brief`,
	REQUIRED_TABS.every((tab) => labels.includes(tab)),
	`missing: ${REQUIRED_TABS.filter((x) => !labels.includes(x)).join(", ")}`);

check("tabs are in the brief's order",
	JSON.stringify(labels) === JSON.stringify(REQUIRED_TABS),
	`got ${labels.join(" / ")}`);

// 2. Every field a tab edits is really stored.
const used = [];
for (const group of GROUPS) {
	for (const field of group.fields) {
		used.push(field.fieldname);
		if (!storedFields.has(field.fieldname)) {
			check(`${group.key}: "${field.fieldname}" exists in the DocType`, false);
		}
	}
}
check("every field edited by a tab exists in the DocType",
	used.every((f) => storedFields.has(f)));

// 3. No field in two tabs — duplicate controls desync.
const seen = new Set();
const dupes = used.filter((f) => (seen.has(f) ? true : (seen.add(f), false)));
check("no field appears in more than one tab", dupes.length === 0, dupes.join(", "));

// 4. Every stored setting is reachable from some tab.
const unreachable = [...editable].filter((f) => !seen.has(f));
check("every stored setting is reachable in the builder", unreachable.length === 0,
	unreachable.join(", "));

// 5. The Tables tab covers what it claims to.
const tables = GROUPS.find((g) => g.key === "tables");
const tableFields = tables ? tables.fields.map((f) => f.fieldname) : [];
for (const expected of [
	"table_header_background", "table_header_text", "table_border_color",
	"table_row_hover", "table_stripe_color", "zebra_tables",
	"table_border_style", "table_row_height", "table_cell_padding",
	"table_header_font_size", "table_sticky_header", "table_header_uppercase",
]) {
	check(`Tables tab: ${expected}`, tableFields.includes(expected));
}

// 6. Control types line up with the stored fieldtypes.
const expectedType = { color: "Color", number: "Int", check: "Check", select: "Select", code: "Code" };
for (const group of GROUPS) {
	for (const field of group.fields) {
		const stored = storedFields.get(field.fieldname);
		if (!stored || field.type === "preset") continue; // preset is a Select with a custom widget
		const want = expectedType[field.type];
		if (want && stored.fieldtype !== want) {
			check(`${field.fieldname}: control "${field.type}" matches fieldtype`, false,
				`DocType says ${stored.fieldtype}, builder renders ${field.type}`);
		}
	}
}
check("control types match the stored fieldtypes", true);

// 7. Select options must match the DocType's, or saving fails validation.
for (const group of GROUPS) {
	for (const field of group.fields) {
		if (field.type !== "select") continue;
		const stored = storedFields.get(field.fieldname);
		const allowed = (stored.options || "").split("\n").filter(Boolean);
		const bad = field.options.filter((o) => !allowed.includes(o));
		if (bad.length) check(`${field.fieldname}: options are valid`, false, `not in DocType: ${bad}`);
	}
}
check("select options are all valid DocType options", true);

// 8. Optional colours are exactly the dark overrides, which may be empty.
const optional = [];
for (const group of GROUPS) {
	for (const field of group.fields) if (field.optional) optional.push(field.fieldname);
}
check("only the dark overrides are optional colours",
	optional.length === 4 && optional.every((f) => f.startsWith("dark_")),
	optional.join(", "));

// Optional fields must have no default, or "empty means derive" is unreachable.
check("optional colours carry no default in the DocType",
	optional.every((f) => storedFields.get(f).default === undefined),
	optional.filter((f) => storedFields.get(f).default !== undefined).join(", "));

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures ? 1 : 0);
