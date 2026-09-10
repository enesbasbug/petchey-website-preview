(() => {
  "use strict";
  const toggle = document.querySelector(".menu-toggle"),
    nav = document.querySelector("#primary-nav");
  if (toggle && nav) {
    const close = () => {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    };
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    });
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        toggle.getAttribute("aria-expanded") === "true"
      ) {
        close();
        toggle.focus();
      }
    });
    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) close();
    });
    matchMedia("(min-width:951px)").addEventListener("change", close);
  }
})();

(() => {
  const buttons = [...document.querySelectorAll("[data-collection-filter]")];
  const cards = [...document.querySelectorAll("[data-collection-type]")];
  if (!buttons.length) return;
  const select = (type) => {
    let count = 0;
    cards.forEach((card) => {
      card.hidden = type !== "all" && card.dataset.collectionType !== type;
      if (!card.hidden) count++;
    });
    buttons.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.collectionFilter === type),
      ),
    );
    document.querySelector(".collection-count").textContent =
      `${count} selected properties`;
    document.querySelector(".collection-empty").hidden = count > 0;
  };
  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      select(button.dataset.collectionFilter),
    ),
  );
  const initial = new URLSearchParams(location.search).get("sector");
  select(["industrial", "residential"].includes(initial) ? initial : "all");
})();

// Count each visible metric once; keep its complete value available to readers.
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced.matches || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        const el = entry.target,
          original = el.textContent;
        const parts = original.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
        if (!parts) return;
        const target = Number(parts[2].replaceAll(",", ""));
        const decimals = (parts[2].split(".")[1] || "").length;
        const visual = document.createElement("span");
        visual.setAttribute("aria-hidden", "true");
        const readable = document.createElement("span");
        readable.className = "sr-only";
        readable.textContent = original;
        el.replaceChildren(visual, readable);
        const start = performance.now();
        const draw = (now) => {
          const progress = reduced.matches
            ? 1
            : Math.min((now - start) / 1400, 1);
          const number = target * (1 - Math.pow(1 - progress, 3));
          visual.textContent =
            progress === 1
              ? original
              : parts[1] +
                number.toLocaleString("en-GB", {
                  minimumFractionDigits: decimals,
                  maximumFractionDigits: decimals,
                }) +
                parts[3];
          if (progress < 1) requestAnimationFrame(draw);
        };
        requestAnimationFrame(draw);
      });
    },
    { threshold: 0.5 },
  );
  document
    .querySelectorAll(".stat-number")
    .forEach((el) => observer.observe(el));
})();
