document.querySelectorAll("[data-property-gallery]").forEach((gallery) => {
  const buttons = [...gallery.querySelectorAll("[data-gallery-index]")];
  const main = gallery.querySelector(".pha-viewer-main");
  const count = gallery.querySelector(".pha-photo-count");
  const title = main.alt.replace(/ — photograph \d+$/, "");
  let index = 0;
  function show(next) {
    index = (next + buttons.length) % buttons.length;
    main.src = buttons[index].querySelector("img").src;
    main.alt = `${title} — photograph ${index + 1}`;
    count.textContent = `${index + 1} / ${buttons.length}`;
    buttons.forEach((button, i) =>
      button.setAttribute("aria-pressed", String(i === index)),
    );
    const strip = gallery.querySelector(".pha-thumbnails");
    strip.scrollLeft = buttons[index].offsetLeft - strip.offsetLeft;
  }
  buttons.forEach((button, i) =>
    button.addEventListener("click", () => show(i)),
  );
  gallery
    .querySelector("[data-gallery-prev]")
    .addEventListener("click", () => show(index - 1));
  gallery
    .querySelector("[data-gallery-next]")
    .addEventListener("click", () => show(index + 1));
  gallery.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      show(index + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
});
