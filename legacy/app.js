// RPG Birmingham: MapLibre vector Cyberpunk map (roads + buildings only).
// Data: OpenStreetMap (data/roads.json, data/buildings.json) + City of Birmingham neighborhoods.
(async function () {
  const cfg = window.RPGB_CONFIG;
  const $ = (id) => document.getElementById(id);
  const msg = (t) => ($("msg").textContent = t);
  const t0 = performance.now();
  const B = cfg.bounds;
  const SHIPT_HEIGHT = 78; // m, approx. (17-story John A. Hand Building)
  const Q = new URLSearchParams(location.search); // ?z=14&pitch=60&b=-20 for testing

  const load = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u + " " + r.status); return r.json(); });
  let roads, buildings, hoods, shipt;
  try {
    [roads, buildings, hoods, shipt] = await Promise.all([load("data/roads.json"), load("data/buildings.json"), load("data/neighborhoods.json"), load("data/shipt.json")]);
  } catch (e) { msg("Data load failed: " + e.message + " (OSM download may not be finished)"); return; }

  const roadsGJ = { type: "FeatureCollection", features: roads.filter((r) => r.c.length > 1).map((r) => ({
    type: "Feature", properties: { k: r.k }, geometry: { type: "LineString", coordinates: r.c } })) };
  // Drop the plain OSM building(s) under the Shipt landmark so the highlighted version shows.
  const sp = shipt.polygon;
  const pip = (x, y, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  const spBox = sp.reduce((b, [x, y]) => ({ w: Math.min(b.w, x), e: Math.max(b.e, x), s: Math.min(b.s, y), n: Math.max(b.n, y) }), { w: 1e9, e: -1e9, s: 1e9, n: -1e9 });
  const underShipt = (b) => {
    const cx = b.p.reduce((a, p) => a + p[0], 0) / b.p.length, cy = b.p.reduce((a, p) => a + p[1], 0) / b.p.length;
    return pip(cx, cy, sp) || (cx >= spBox.w && cx <= spBox.e && cy >= spBox.s && cy <= spBox.n);
  };
  const bldGJ = { type: "FeatureCollection", features: buildings.filter((b) => !underShipt(b)).map((b) => ({
    type: "Feature", properties: { h: Math.max(5, Math.min(220, b.h || 8)) }, geometry: { type: "Polygon", coordinates: [b.p] } })) };

  const map = new maplibregl.Map({
    container: "map",
    style: { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": "#050b1a" } }] },
    center: Q.has("c") ? Q.get("c").split(",").map(Number) : [cfg.overview.lon, cfg.overview.lat], zoom: +Q.get("z") || 11.6, pitch: +Q.get("pitch") || 55, bearing: Q.has("b") ? +Q.get("b") : -20,
    minZoom: 10, maxZoom: 18.5, maxPitch: 80,
    maxBounds: [[B.west - 0.02, B.south - 0.02], [B.east + 0.02, B.north + 0.02]],
    antialias: false, fadeDuration: 0, attributionControl: false,
  });
  map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: "© OpenStreetMap contributors · City of Birmingham GIS" }));

  map.on("load", () => {
    map.addSource("roads", { type: "geojson", data: roadsGJ });
    map.addSource("bld", { type: "geojson", data: bldGJ });
    map.addSource("hoods", { type: "geojson", data: hoods });

    // Roads: soft wide glow under a thin bright core; bigger roads are wider/brighter.
    const byClass = (v0, v1, v2, v3, v4) => ["match", ["get", "k"], 0, v0, 1, v1, 2, v2, 3, v3, v4];
    map.addLayer({ id: "roads-glow", type: "line", source: "roads", layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#ffcf1f", "line-opacity": 0.05, "line-blur": 4,
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, byClass(3, 2.5, 2, 1.5, 1), 17, byClass(14, 12, 10, 8, 6)] } });
    map.addLayer({ id: "roads", type: "line", source: "roads", layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": byClass("#b89a2e", "#a88a2a", "#8f742a", "#7a6428", "#66552a"), "line-opacity": 0.5,
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, byClass(1.0, 0.8, 0.6, 0.5, 0.4), 17, byClass(3.0, 2.5, 2.0, 1.6, 1.1)] } });

    // Buildings: low-detail dark-cyan blocks, taller = brighter; thin footprint lines on the ground.
    map.addLayer({ id: "bld-line", type: "line", source: "bld", paint: { "line-color": "#4ff0ff", "line-width": 0.5, "line-opacity": 0.28 } });
    map.addLayer({ id: "bld", type: "fill-extrusion", source: "bld", paint: {
      "fill-extrusion-height": ["get", "h"], "fill-extrusion-base": 0,
      "fill-extrusion-color": ["interpolate", ["linear"], ["get", "h"], 5, "#06303a", 30, "#0a6f80", 90, "#2ee6f5"],
      "fill-extrusion-opacity": 0.92, "fill-extrusion-vertical-gradient": true } });

    // Districts: faint always-on borders so every area reads as a region; strong highlight on hover.
    map.addLayer({ id: "hood-base", type: "line", source: "hoods", paint: { "line-color": "#5ff3ff", "line-width": 1, "line-opacity": 0.3 } });
    map.addLayer({ id: "hood-fill", type: "fill", source: "hoods", filter: ["==", "NAME", ""], paint: { "fill-color": "#5ff3ff", "fill-opacity": 0.2 } });
    map.addLayer({ id: "hood-glow", type: "line", source: "hoods", filter: ["==", "NAME", ""], paint: { "line-color": "#5ff3ff", "line-width": 16, "line-blur": 8, "line-opacity": 0.6 } });
    map.addLayer({ id: "hood-line", type: "line", source: "hoods", filter: ["==", "NAME", ""], paint: { "line-color": "#bffcff", "line-width": 2.6, "line-opacity": 1 } });

    // --- Shipt HQ: glowing green block + floating logo marker (game-style landmark) ---
    map.addSource("shipt", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [shipt.polygon] } } });
    map.addLayer({ id: "shipt-glow", type: "line", source: "shipt", paint: { "line-color": "#23cc6b", "line-width": 18, "line-blur": 10, "line-opacity": 0.7 } });
    map.addLayer({ id: "shipt-bld", type: "fill-extrusion", source: "shipt", paint: {
      "fill-extrusion-height": SHIPT_HEIGHT, "fill-extrusion-base": 0, "fill-extrusion-color": "#23cc6b", "fill-extrusion-opacity": 0.95, "fill-extrusion-vertical-gradient": true } });
    map.addLayer({ id: "shipt-line", type: "line", source: "shipt", paint: { "line-color": "#b9ffd6", "line-width": 2 } });

    const el = document.createElement("div");
    el.className = "landmark";
    el.innerHTML = '<div class="badge"><img src="assets/shipt-logo.svg" alt="Shipt"></div><div class="stem"></div><div class="ring"></div>';
    el.title = shipt.name;
    el.onclick = () => map.flyTo({ center: [shipt.lon, shipt.lat], zoom: 16.3, pitch: 62, duration: 2200 });
    new maplibregl.Marker({ element: el, anchor: "bottom", offset: [0, 0] }).setLngLat([shipt.lon, shipt.lat]).addTo(map);

    window.RPGB_MAP = { map, areaAt: (lon, lat) => areaAt(lon, lat), shipt };
    window.dispatchEvent(new Event("rpgb-map-ready"));
    msg("");
    $("load").textContent = ((performance.now() - t0) / 1000).toFixed(1) + "s";
  });

  // --- Neighborhood picking (point-in-polygon) ---
  const fix = (n) => n.replace(/Hghts|Hgts/g, "Heights").replace(/Hghlands/g, "Highlands").replace(/Prk/g, "Park")
    .replace(/\bHts\b/g, "Heights").replace(/\bVlg\b/g, "Village");
  const areas = hoods.features.map((f) => {
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    const rects = polys.map((p) => {
      let w = 1e9, s = 1e9, e = -1e9, n = -1e9;
      for (const [x, y] of p[0]) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
      return { w, s, e, n };
    });
    return { raw: f.properties.NAME, name: fix(f.properties.NAME), polys, rects };
  });
  const inRing = (x, y, ring) => {
    let c = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const areaAt = (lon, lat) => {
    for (const a of areas) for (let k = 0; k < a.polys.length; k++) {
      const r = a.rects[k];
      if (lon < r.w || lon > r.e || lat < r.s || lat > r.n) continue;
      if (inRing(lon, lat, a.polys[k][0])) return a;
    }
    return null;
  };
  let current = null;
  function show(a) {
    if (a === current || !map.getLayer("hood-line")) return;
    current = a;
    const f = ["==", "NAME", a ? a.raw : ""];
    ["hood-fill", "hood-glow", "hood-line"].forEach((id) => map.setFilter(id, f));
    $("areaName").textContent = a ? a.name : "Hover or tap an area";
    if (window.RPGB_onArea) window.RPGB_onArea(a);
  }
  const at = (e) => areaAt(e.lngLat.lng, e.lngLat.lat);
  map.on("mousemove", (e) => show(at(e)));
  map.on("click", (e) => show(at(e)));

  // --- FPS (render-driven, so it reads low/0 when idle) ---
  let frames = 0, last = performance.now();
  map.on("render", () => {
    frames++;
    const now = performance.now();
    if (now - last >= 500) { $("fps").textContent = ((frames * 1000) / (now - last)).toFixed(0); frames = 0; last = now; }
  });
})();
