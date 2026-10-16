(() => {
  "use strict";
  const playground = document.querySelector(
    'meta[name="petchey-palette-playground"]',
  );
  const storageKey =
    "petchey.paletteLab.v1" + (playground ? ":" + playground.content : "");
  const defaults = { primary: "#102e4a", base: "#ffffff", third: "#286c79" };
  const valid = (value) =>
    typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  let state = { ...defaults };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Object.keys(defaults).every((key) => valid(saved[key])))
      state = saved;
  } catch (_) {
    /* Storage can be unavailable in private browsing. */
  }
  const incoming = new URLSearchParams(location.search);
  const shared = Object.fromEntries(
    Object.keys(defaults).map((key) => [
      key,
      "#" + (incoming.get("palette_" + key) || ""),
    ]),
  );
  if (Object.keys(defaults).every((key) => valid(shared[key]))) {
    state = shared;
    // Consume shared values once so subsequent edits and resets survive a reload.
    const cleanUrl = new URL(location.href);
    Object.keys(defaults).forEach((key) =>
      cleanUrl.searchParams.delete("palette_" + key),
    );
    history.replaceState(history.state, "", cleanUrl.href);
  }
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const hex = (values) =>
    "#" +
    values.map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, weight) =>
    hex(rgb(a).map((x, i) => x * (1 - weight) + rgb(b)[i] * weight));
  const luminance = (colour) =>
    rgb(colour)
      .map((x) => x / 255)
      .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
      .reduce((sum, x, i) => sum + x * [0.2126, 0.7152, 0.0722][i], 0);
  const contrast = (a, b) => {
    const [dark, light] = [luminance(a), luminance(b)].sort((x, y) => x - y);
    return (light + 0.05) / (dark + 0.05);
  };
  const ink = (background) =>
    contrast(background, state.base) >= 4.5
      ? state.base
      : contrast(background, state.primary) >= 4.5
        ? state.primary
        : contrast(background, "#ffffff") > contrast(background, "#111111")
          ? "#ffffff"
          : "#111111";
  const root = document.documentElement;
  const apply = () => {
    const values = {
      "--navy": state.primary,
      "--deep": mix(state.primary, "#000000", 0.18),
      "--ink":
        contrast(state.primary, state.base) >= 4.5
          ? state.primary
          : ink(state.base),
      "--muted": mix(ink(state.base), state.base, 0.23),
      "--pale": mix(state.base, state.primary, 0.045),
      "--line": mix(state.base, state.primary, 0.18),
      "--blue": state.third,
      "--accent-preview": state.third,
      "--accent-preview-on-white": state.third,
      "--accent-preview-text": ink(state.third),
      "--accent-preview-light": mix(state.third, state.base, 0.75),
      "--lab-base": state.base,
      "--lab-on-primary": ink(state.primary),
      "--lab-on-third": ink(state.third),
      "--lab-on-base": ink(state.base),
      "--lab-border-third": mix(state.third, ink(state.third), 0.32),
    };
    Object.entries(values).forEach(([key, value]) =>
      root.style.setProperty(key, value),
    );
    root.classList.add("ph-palette-active");
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (_) {}
  };
  apply();
  const host = document.createElement("aside");
  host.className = "ph-palette-lab";
  host.setAttribute(
    "aria-label",
    playground ? "Website colour playground" : "Local website colour workbench",
  );
  host.innerHTML = `
    <button class="pl-toggle" type="button" aria-expanded="false" aria-controls="ph-palette-panel"><span class="pl-swatch-stack" aria-hidden="true"><i></i><i></i><i></i></span>Colours</button>
    <div id="ph-palette-panel" class="pl-panel" hidden>
      <div class="pl-heading"><div><span class="pl-eyebrow">${playground ? "COLOUR PLAYGROUND" : "LOCAL DESIGN STUDIO"}</span><h2>Try your palette</h2></div><button type="button" class="pl-close" aria-label="Close colour panel">×</button></div>
      <p class="pl-intro">Change the three main colours and see every page update instantly.</p>
      <div class="pl-fields"></div>
      <div class="pl-presets"><p>Starting points</p><div></div></div>
      <p class="pl-contrast" aria-live="polite"></p>
      <div class="pl-actions"><button type="button" class="pl-reset">Reset colours</button><button type="button" class="pl-copy">Copy palette</button></div>
      <p class="pl-status" role="status">Saved in this browser. ${playground ? "The main demo stays unchanged." : "Local preview only."}</p>
    </div>`;
  document.body.append(host);
  const fields = host.querySelector(".pl-fields");
  const definitions = [
    ["primary", "01", "Navy / primary", "Footer and main text"],
    ["base", "02", "White / background", "Page and card backgrounds"],
    ["third", "03", "Third main colour", "Feature sections and key actions"],
  ];
  for (const [key, number, label, hint] of definitions) {
    const row = document.createElement("div");
    row.className = "pl-field";
    row.innerHTML = `<div class="pl-field-label"><span>${number}</span><div><label for="pl-${key}">${label}</label><small>${hint}</small></div></div><div class="pl-inputs"><input id="pl-${key}" type="color" aria-label="${label} colour picker"><input id="pl-${key}-hex" type="text" aria-label="${label} hex code" spellcheck="false" maxlength="7" pattern="#[0-9a-fA-F]{6}"></div>`;
    fields.append(row);
    row
      .querySelector("input[type=color]")
      .addEventListener("input", (event) => {
        state[key] = event.target.value;
        apply();
        sync();
      });
    const text = row.querySelector("input[type=text]");
    text.addEventListener("input", () => {
      const value = text.value.startsWith("#") ? text.value : "#" + text.value;
      if (valid(value)) {
        state[key] = value.toLowerCase();
        apply();
        sync();
      } else text.setAttribute("aria-invalid", "true");
    });
    text.addEventListener("blur", () => {
      if (!valid(text.value)) sync();
    });
  }
  const presets = {
    Petrol: { ...defaults },
    Burgundy: { ...defaults, third: "#79434f" },
    Cobalt: { ...defaults, third: "#315da5" },
    Olive: { ...defaults, third: "#626944" },
  };
  for (const [name, colours] of Object.entries(presets)) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;
    button.style.setProperty("--preset-colour", colours.third);
    button.addEventListener("click", () => {
      state = { ...colours };
      apply();
      sync();
    });
    host.querySelector(".pl-presets>div").append(button);
  }
  const sync = () => {
    for (const [key] of definitions) {
      host.querySelector("#pl-" + key).value = state[key];
      const text = host.querySelector("#pl-" + key + "-hex");
      text.value = state[key].toUpperCase();
      text.removeAttribute("aria-invalid");
    }
    host
      .querySelectorAll(".pl-swatch-stack i")
      .forEach(
        (swatch, i) =>
          (swatch.style.background = state[["primary", "base", "third"][i]]),
      );
    const ratio = contrast(state.primary, state.base);
    host.querySelector(".pl-contrast").textContent =
      `Primary / background contrast: ${ratio.toFixed(1)}:1${ratio < 4.5 ? " — try more contrast for readable text." : " — good for text."}`;
    for (const button of host.querySelectorAll(".pl-presets button"))
      button.setAttribute(
        "aria-pressed",
        String(
          Object.keys(defaults).every(
            (key) => state[key] === presets[button.textContent][key],
          ),
        ),
      );
  };
  const panel = host.querySelector(".pl-panel"),
    toggle = host.querySelector(".pl-toggle");
  const open = (value) => {
    panel.hidden = !value;
    toggle.setAttribute("aria-expanded", String(value));
    try {
      sessionStorage.setItem(storageKey + ".open", String(value));
    } catch (_) {}
  };
  toggle.addEventListener("click", () => open(panel.hidden));
  host.querySelector(".pl-close").addEventListener("click", () => {
    open(false);
    toggle.focus();
  });
  host.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      open(false);
      toggle.focus();
    }
  });
  host.querySelector(".pl-reset").addEventListener("click", () => {
    state = { ...defaults };
    apply();
    sync();
  });
  host.querySelector(".pl-copy").addEventListener("click", async () => {
    try {
      const shareUrl = new URL(location.href);
      shareUrl.searchParams.set("palette", "1");
      Object.keys(defaults).forEach((key) =>
        shareUrl.searchParams.set("palette_" + key, state[key].slice(1)),
      );
      await navigator.clipboard.writeText(
        `Petchey palette\nPrimary: ${state.primary}\nBackground: ${state.base}\nThird colour: ${state.third}\nPreview: ${shareUrl.href}`,
      );
      host.querySelector(".pl-status").textContent =
        "Palette copied. Paste it into our chat to share your choice.";
    } catch (_) {
      host.querySelector(".pl-status").textContent =
        `Primary ${state.primary} · Background ${state.base} · Third ${state.third}`;
    }
  });
  sync();
  let startOpen = new URLSearchParams(location.search).get("palette") === "1";
  try {
    const savedOpen = sessionStorage.getItem(storageKey + ".open");
    startOpen =
      startOpen || (savedOpen === null ? !!playground : savedOpen === "true");
  } catch (_) {}
  open(startOpen);
})();
