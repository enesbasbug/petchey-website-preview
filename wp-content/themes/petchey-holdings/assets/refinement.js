// Keep native disclosure controls without JavaScript; support click, keyboard and fine-pointer hover.
document.querySelectorAll("[data-team-directory]").forEach((directory) => {
  const people = [...directory.querySelectorAll(".team-person")];
  const hover = matchMedia(
    "(hover: hover) and (pointer: fine) and (min-width: 901px)",
  );
  const stage = document.createElement("div");
  stage.className = "team-stage";
  directory.append(stage);
  const wide = matchMedia("(min-width: 901px)");
  const arrange = () => {
    people.forEach((person, index) => {
      const panel = person._preview || person.querySelector(".person-preview");
      person._preview = panel;
      panel.id = "team-profile-" + index;
      person.querySelector("summary").setAttribute("aria-controls", panel.id);
      if (wide.matches) stage.append(panel);
      else person.append(panel);
      panel.hidden = !person.open;
    });
  };
  directory.classList.add("team-ready");
  arrange();
  wide.addEventListener("change", arrange);
  const select = (person) =>
    people.forEach((item) => {
      item.open = item === person;
      item._preview.hidden = item !== person;
    });
  people.forEach((person) => {
    const summary = person.querySelector("summary");
    summary.addEventListener("click", (event) => {
      event.preventDefault();
      select(person);
    });
    summary.addEventListener("pointerenter", () => {
      if (hover.matches) select(person);
    });
    summary.addEventListener("focus", () => {
      if (hover.matches) select(person);
    });
  });
});

// Background video is decorative; the poster always works without script or playback permission.
document.querySelectorAll("[data-hero-film]").forEach((hero) => {
  const video = hero.querySelector("video");
  const button = hero.querySelector("[data-film-toggle]");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let userPaused = reduced.matches || navigator.connection?.saveData === true;
  let visible = true;
  const load = () => {
    if (!video.src) video.src = video.dataset.src;
  };
  const play = () => {
    if (userPaused || document.hidden || !visible) return;
    load();
    video.play().catch(() => {
      button.textContent = "Play video";
    });
  };
  button.hidden = false;
  video.addEventListener("playing", () => {
    button.textContent = "Pause video";
  });
  video.addEventListener("pause", () => {
    button.textContent = "Play video";
  });
  video.addEventListener("error", () => {
    video.hidden = true;
    button.hidden = true;
  });
  button.addEventListener("click", () => {
    if (video.paused) {
      userPaused = false;
      play();
    } else {
      userPaused = true;
      video.pause();
    }
  });
  reduced.addEventListener("change", () => {
    userPaused = reduced.matches;
    userPaused ? video.pause() : play();
  });
  document.addEventListener("visibilitychange", () =>
    document.hidden ? video.pause() : play(),
  );
  if ("IntersectionObserver" in window)
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        visible ? play() : video.pause();
      },
      { threshold: 0.1 },
    ).observe(hero);
  play();
});
