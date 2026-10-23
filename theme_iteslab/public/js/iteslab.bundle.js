// Theme ItesLab — Desk bundle entry.
//
// Import order is the initialisation order: utils create the namespace, compat
// works out which Desk shell we are in, theme paints the variables, and the
// surface modules attach. Logout is loaded early and is independent of the
// rest, so a styling problem can never take the session controls with it.

import "./iteslab-utils.js";
import "./iteslab-compat.js";
import "./iteslab-theme.js";
import "./iteslab-logout.js";
import "./iteslab-sidebar.js";
import "./iteslab-navbar.js";
import "./iteslab-workspace.js";
