(() => {
  "use strict";
  const root = document.getElementById("portfolio-map"),
    status = document.getElementById("map-status");
  if (!root || typeof phMap === "undefined") return;
  const entries = [...document.querySelectorAll("[data-asset-type]")],
    buttons = [...document.querySelectorAll("[data-asset-filter]")];
  let map,
    cluster,
    filter = "all";
  const paint = () => {
    const selected = phMap.locations.filter(
      (p) => filter === "all" || p.type === filter,
    );
    entries.forEach(
      (e) => (e.hidden = filter !== "all" && e.dataset.assetType !== filter),
    );
    status.textContent = `${selected.length} portfolio location${selected.length === 1 ? "" : "s"}`;
    if (!cluster) return;
    cluster.clearLayers();
    selected.forEach((p) => {
      const marker = L.marker([p.lat, p.lng], {
        title: p.name,
        alt: p.name,
        icon: L.divIcon({
          className: `map-pin ${p.type}`,
          iconSize: [17, 17],
          iconAnchor: [8, 8],
        }),
      });
      const box = document.createElement("div"),
        title = document.createElement("strong"),
        place = document.createElement("div"),
        type = document.createElement("div"),
        link = document.createElement("a");
      title.textContent = p.name;
      place.textContent = p.location;
      type.textContent = [p.label, p.size].filter(Boolean).join(" · ");
      link.textContent = "Explore property";
      link.href = p.url;
      box.append(title, place, type, link);
      marker.bindPopup(box);
      cluster.addLayer(marker);
    });
  };
  buttons.forEach((b) =>
    b.addEventListener("click", () => {
      filter = b.dataset.assetFilter;
      buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      paint();
    }),
  );
  paint();
  if (typeof L === "undefined") {
    status.textContent += " · Map unavailable; use the location list.";
    return;
  }
  map = L.map(root, {
    scrollWheelZoom: true,
    minZoom: 6,
    zoomSnap: 0.5,
    maxZoom: 18,
    attributionControl: true,
  });
  // Frame the actual portfolio, rather than a country/continent overview.
  const locations = phMap.locations
    .filter(
      (p) => Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)),
    )
    .map((p) => [Number(p.lat), Number(p.lng)]);
  const framePortfolio = () => {
    if (locations.length) {
      map.fitBounds(L.latLngBounds(locations), {
        padding: [50, 50],
        maxZoom: 8.5,
        animate: false,
      });
    } else {
      map.setView([51.55, -0.1], 8);
    }
  };
  framePortfolio();
  map.on("resize", framePortfolio);
  cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 35,
    iconCreateFunction: (c) =>
      L.divIcon({
        html: String(c.getChildCount()),
        className: "map-cluster",
        iconSize: [38, 38],
      }),
  });
  map.addLayer(cluster);
  const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    noWrap: true,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    className: "ph-map-tiles",
  }).addTo(map);
  tiles.on("tileerror", () => {
    status.textContent =
      "Map background unavailable. Property pins remain interactive; you can also browse the location list below.";
  });
  L.control.scale({ imperial: true, metric: true }).addTo(map);
  paint();
})();
