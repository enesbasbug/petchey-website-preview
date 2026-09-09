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
