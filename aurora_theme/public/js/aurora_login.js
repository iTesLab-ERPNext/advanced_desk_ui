(function () {
	function injectBackground() {
		if (document.querySelector(".aurora-login-bg")) return;
		const bg = document.createElement("div");
		bg.className = "aurora-login-bg";
		bg.innerHTML = `<div class="aurora-login-blob b1"></div><div class="aurora-login-blob b2"></div><div class="aurora-login-blob b3"></div>`;
		document.body.prepend(bg);
	}

	function injectDarkToggle() {
		if (document.querySelector(".aurora-login-dark-toggle")) return;
		let mode = "light";
		try {
			mode = localStorage.getItem("aurora:theme") || "light";
		} catch (e) {
			/* noop */
		}
		document.documentElement.setAttribute("data-aurora-theme", mode);

		const btn = document.createElement("button");
		btn.className = "aurora-login-dark-toggle";
		btn.setAttribute("title", "Toggle dark mode");
		btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>`;
		btn.addEventListener("click", () => {
			const isDark = document.documentElement.getAttribute("data-aurora-theme") === "dark";
			const next = isDark ? "light" : "dark";
			document.documentElement.setAttribute("data-aurora-theme", next);
			try {
				localStorage.setItem("aurora:theme", next);
			} catch (e) {
				/* noop */
			}
		});
		document.body.appendChild(btn);
	}

	document.addEventListener("DOMContentLoaded", function () {
		injectBackground();
		injectDarkToggle();
	});
})();
