document.addEventListener("DOMContentLoaded", function () {
	document.querySelectorAll(".aurora-stat-value[data-count-to]").forEach((el) => {
		const target = parseFloat(el.getAttribute("data-count-to")) || 0;
		const isMoney = el.hasAttribute("data-money");
		const duration = 700;
		const start = performance.now();

		function tick(now) {
			const progress = Math.min((now - start) / duration, 1);
			const value = target * progress;
			el.textContent = isMoney ? value.toFixed(2) : Math.round(value);
			if (progress < 1) requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
	});
});
