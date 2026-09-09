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
      link.textContent = "Explore property →";
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
    scrollWheelZoom: false,
    minZoom: 5,
    maxZoom: 13,
    attributionControl: true,
  }).setView([54.5, -3.1], 5);
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
  map.attributionControl.addAttribution(
    "Boundaries: Natural Earth (public domain)",
  );
  fetch(phMap.boundaries)
    .then((r) => {
      if (!r.ok) throw Error("Map unavailable");
      return r.json();
    })
    .then((data) =>
      L.geoJSON(data, {
        style: (f) => ({
          fillColor:
            f.properties.name === "United Kingdom" ? "#f8faf9" : "#d8e2e6",
          fillOpacity: 1,
          color: "#bdcdd5",
          weight: 1,
        }),
        interactive: false,
      }).addTo(map),
    )
    .catch(() => {
      status.textContent +=
        " · Background unavailable; location pins and list remain available.";
    });
  paint();
})();
