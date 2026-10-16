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

// Motion enhances content without taking over native scrolling.
(() => {
  const isHome = document.body.classList.contains('home');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window)) return;
  const homeTargets = '.hero-heading, .hero-aside, .legacy-section > div, .home-collection .section-heading, .sector-card, .intro-grid, .activities .section-heading, .activity, .feature-copy > *, .story-grid > *, .availability > *';
  const pageTargets = '.page-intro > *, .wide-image, .content-split > *, #legacy > *, .milestone, .people-grid .person, .service-row, .property-showcase, main .story-grid > *, .portfolio-availability > *, .contact-info';
  const targets = [...document.querySelectorAll(isHome ? homeTargets : pageTargets)];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('motion-visible');
      observer.unobserve(entry.target);
    });
  }, {threshold: 0.12});
  targets.forEach(el => {
    // Content already above the viewport must stay available on restored scrolls.
    if (reduced.matches || el.getBoundingClientRect().bottom < 0) return;
    el.classList.add('motion-reveal');
    observer.observe(el);
  });
  const hero = isHome ? document.querySelector('.hero-estate') : null;
  let frame = 0;
  const paint = () => {
    frame = 0;
    if (!hero || reduced.matches) return;
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight * .85)));
    hero.style.setProperty('--image-inset', `${(1-progress)*7}%`);
    hero.style.setProperty('--image-scale', String(1.08-progress*.08));
  };
  const update = () => { if (!frame) frame = requestAnimationFrame(paint); };
  addEventListener('scroll', update, {passive:true});
  addEventListener('resize', update, {passive:true});
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      targets.forEach(el => el.classList.add('motion-visible'));
      hero?.style.removeProperty('--image-inset');
      hero?.style.removeProperty('--image-scale');
    } else update();
  });
  update();
})();

// Accessible manual property showcase; without JS all properties remain visible.
(() => {
  const tour = document.querySelector('[data-property-tour]');
  if (!tour) return;
  const panels = [...tour.querySelectorAll('[data-tour-panel]')];
  const buttons = [...tour.querySelectorAll('[data-tour-select]')];
  const select = index => {
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
      panel.classList.toggle('is-selected', i === index);
    });
    buttons.forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === index));
      button.setAttribute('aria-controls', panels[i].id);
    });
  };
  buttons.forEach((button, i) => button.addEventListener('click', () => select(i)));
  select(0);
  tour.querySelector('.tour-navigation').hidden = false;
})();
