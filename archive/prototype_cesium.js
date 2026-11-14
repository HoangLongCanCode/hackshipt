// Prototype: vector Cyberpunk map of Birmingham (roads + buildings only, no photo tiles).
// Data: OpenStreetMap roads/buildings (data/roads.json, data/buildings.json) and the
// City of Birmingham's official 99 neighborhoods (data/neighborhoods.json).
(async function () {
  const cfg = window.RPGB_CONFIG;
  const $ = (id) => document.getElementById(id);
  const msg = (t) => ($("msg").textContent = t);
  const t0 = performance.now();

  const viewer = new Cesium.Viewer("cesiumContainer", {
    baseLayer: false, baseLayerPicker: false, geocoder: false, homeButton: false,
    sceneModePicker: false, navigationHelpButton: false, animation: false, timeline: false,
    fullscreenButton: false, selectionIndicator: false, infoBox: false,
    requestRenderMode: true, maximumRenderTimeChange: Infinity, // render only when something changes (battery-friendly)
  });
  const scene = viewer.scene;
  scene.skyAtmosphere.show = false; scene.sun.show = false; scene.moon.show = false; scene.skyBox.show = false;
  scene.backgroundColor = Cesium.Color.fromCssColorString("#050b1a");
  scene.globe.baseColor = Cesium.Color.fromCssColorString("#07101f");
  scene.globe.showGroundAtmosphere = false;
  scene.globe.enableLighting = false;
  scene.msaaSamples = 1;
  scene.postProcessStages.fxaa.enabled = true;
  const ctl = scene.screenSpaceCameraController;
  ctl.minimumZoomDistance = 60;
  ctl.maximumZoomDistance = cfg.maxAltitude;

  // Fixed light so building faces shade consistently (no time-of-day).
  const o = cfg.overview;
  const enu = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(o.lon, o.lat, 0));
  scene.light = new Cesium.DirectionalLight({
    direction: Cesium.Matrix4.multiplyByPointAsVector(enu, new Cesium.Cartesian3(0.5, 0.35, -0.8), new Cesium.Cartesian3()),
  });

  // --- Camera ---
  const B = cfg.bounds;
  const clampRect = Cesium.Rectangle.fromDegrees(B.west, B.south, B.east, B.north);
  const ctr = Cesium.Cartesian3.fromDegrees(o.lon, o.lat, 0);
  viewer.camera.lookAt(ctr, new Cesium.HeadingPitchRange(Cesium.Math.toRadians(o.heading), Cesium.Math.toRadians(o.pitch), 14000));
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

  // --- Load data ---
  const load = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u + " " + r.status); return r.json(); });
  let roads, buildings, hoods;
  try {
    [roads, buildings, hoods] = await Promise.all([load("data/roads.json"), load("data/buildings.json"), load("data/neighborhoods.json")]);
  } catch (e) { msg("Data load failed: " + e.message); return; }

  // --- Roads: glowing yellow, thicker for bigger roads ---
  const roadStyle = [
    { w: 3.0, c: "#ffd21a", a: 1.0 },   // motorway / trunk
    { w: 2.4, c: "#ffd21a", a: 0.9 },   // primary
    { w: 1.8, c: "#f2c418", a: 0.8 },   // secondary
    { w: 1.4, c: "#d9ae16", a: 0.7 },   // tertiary
    { w: 1.0, c: "#a8861a", a: 0.55 },  // residential / other
  ];
  roadStyle.forEach((st, k) => {
    const list = roads.filter((r) => r.k === k && r.c.length > 1);
    if (!list.length) return;
    const color = Cesium.Color.fromCssColorString(st.c).withAlpha(st.a);
    const instances = list.map((r) => new Cesium.GeometryInstance({
      geometry: new Cesium.PolylineGeometry({
        positions: Cesium.Cartesian3.fromDegreesArray(r.c.flat()),
        width: st.w, vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
      }),
      attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(color) },
    }));
    scene.primitives.add(new Cesium.Primitive({
      geometryInstances: instances,
      appearance: new Cesium.PolylineColorAppearance({ translucent: st.a < 1 }),
      asynchronous: true,
    }));
  });

  // --- Buildings: low-detail cyan blocks + a thin bright roof outline ---
  const lerp = (a, b, t) => a + (b - a) * t;
  const CHUNK = 3000;
  const heightOf = (b) => Math.max(5, Math.min(220, b.h || 8));
  for (let i = 0; i < buildings.length; i += CHUNK) {
    const part = buildings.slice(i, i + CHUNK);
    const solids = [], lines = [];
    for (const b of part) {
      const hgt = heightOf(b);
      const t = Math.min(1, hgt / 90);
      const hier = new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(b.p.flat()));
      solids.push(new Cesium.GeometryInstance({
        geometry: new Cesium.PolygonGeometry({
          polygonHierarchy: hier, extrudedHeight: hgt, height: 0,
          vertexFormat: Cesium.PerInstanceColorAppearance.FLAT_VERTEX_FORMAT,
        }),
        attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(lerp(0.0, 0.08, t), lerp(0.18, 0.55, t), lerp(0.24, 0.62, t), 1)) },
      }));
      lines.push(new Cesium.GeometryInstance({
        geometry: new Cesium.PolygonOutlineGeometry({ polygonHierarchy: hier, height: hgt }),
        attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(0.25, 0.95, 1.0, 0.95)) },
      }));
    }
    const p1 = scene.primitives.add(new Cesium.Primitive({
      geometryInstances: solids, asynchronous: true,
      appearance: new Cesium.PerInstanceColorAppearance({ flat: false, translucent: false, closed: true }),
    }));
    const p2 = scene.primitives.add(new Cesium.Primitive({
      geometryInstances: lines, asynchronous: true,
      appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true, renderState: { lineWidth: 1 } }),
    }));
    [p1, p2].forEach((p) => p.errorEvent && p.errorEvent.addEventListener((e) => console.warn("chunk failed", e && e.message)));
    await new Promise((r) => setTimeout(r, 0)); // keep UI responsive while queuing
  }
  msg(`${roads.length.toLocaleString()} roads · ${buildings.length.toLocaleString()} buildings`);
  $("load").textContent = ((performance.now() - t0) / 1000).toFixed(1) + "s";

  // --- Neighborhoods: faint outline on hover/tap (like a game map) ---
  const fix = (n) => n.replace(/Hghts|Hgts/g, "Heights").replace(/Hghlands/g, "Highlands").replace(/Prk/g, "Park")
    .replace(/\bHts\b/g, "Heights").replace(/\bVlg\b/g, "Village").replace(/\bSt\b\.?/g, "St.");
  const areas = [];
  for (const f of hoods.features) {
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    const rects = polys.map((p) => {
      let w = 1e9, s = 1e9, e = -1e9, n = -1e9;
      for (const [x, y] of p[0]) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
      return { w, s, e, n };
    });
    areas.push({ name: fix(f.properties.NAME), polys, rects });
  }
  const inRing = (x, y, ring) => {
    let c = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const areaAt = (lon, lat) => {
    for (const a of areas) {
      for (let k = 0; k < a.polys.length; k++) {
        const r = a.rects[k];
        if (lon < r.w || lon > r.e || lat < r.s || lat > r.n) continue;
        if (inRing(lon, lat, a.polys[k][0])) return a;
      }
    }
    return null;
  };

  const edge = Cesium.Color.fromCssColorString("#5ff3ff");
  const hoverEntities = [];
  let current = null;
  function show(a) {
    if (a === current) return;
    current = a;
    hoverEntities.splice(0).forEach((e) => viewer.entities.remove(e));
    $("areaName").textContent = a ? a.name : "Hover or tap an area";
    if (a) {
      a.polys.forEach((p) => {
        const pos = Cesium.Cartesian3.fromDegreesArray(p[0].flat());
        hoverEntities.push(
          viewer.entities.add({ polygon: { hierarchy: pos, height: 1, material: edge.withAlpha(0.07) } }),
          viewer.entities.add({ polyline: { positions: pos, width: 2, material: new Cesium.PolylineGlowMaterialProperty({ glowPower: 0.25, color: edge.withAlpha(0.55) }) } })
        );
      });
    }
    scene.requestRender();
  }
  const pickArea = (pos) => {
    const p = viewer.camera.pickEllipsoid(pos, scene.globe.ellipsoid);
    if (!p) return null;
    const c = Cesium.Cartographic.fromCartesian(p);
    return areaAt(Cesium.Math.toDegrees(c.longitude), Cesium.Math.toDegrees(c.latitude));
  };
  const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  handler.setInputAction((m) => show(pickArea(m.endPosition)), Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  handler.setInputAction((m) => show(pickArea(m.position)), Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // --- Keep camera over Birmingham + WASD/QE ---
  const keys = new Set();
  addEventListener("keydown", (e) => keys.add(e.code));
  addEventListener("keyup", (e) => keys.delete(e.code));
  addEventListener("blur", () => keys.clear());
  viewer.camera.changed.addEventListener(() => {
    const cam = viewer.camera, pc = cam.positionCartographic;
    const lon = Cesium.Math.clamp(pc.longitude, clampRect.west, clampRect.east);
    const lat = Cesium.Math.clamp(pc.latitude, clampRect.south, clampRect.north);
    if (lon !== pc.longitude || lat !== pc.latitude)
      cam.setView({ destination: Cesium.Cartesian3.fromRadians(lon, lat, pc.height), orientation: { heading: cam.heading, pitch: cam.pitch, roll: cam.roll } });
  });
  viewer.clock.onTick.addEventListener(() => {
    if (!keys.size) return;
    const cam = viewer.camera;
    let speed = Math.max(5, cam.positionCartographic.height) * 0.03;
    if (keys.has("ShiftLeft") || keys.has("ShiftRight")) speed *= 4;
    if (keys.has("KeyW")) cam.moveForward(speed);
    if (keys.has("KeyS")) cam.moveBackward(speed);
    if (keys.has("KeyA")) cam.moveLeft(speed);
    if (keys.has("KeyD")) cam.moveRight(speed);
    if (keys.has("KeyE")) cam.moveUp(speed);
    if (keys.has("KeyQ")) cam.moveDown(speed);
    scene.requestRender();
  });

  // --- FPS (only meaningful while moving; idle = 0 because of request-render mode) ---
  let frames = 0, last = performance.now();
  scene.postRender.addEventListener(() => {
    frames++;
    const now = performance.now();
    if (now - last >= 500) { $("fps").textContent = ((frames * 1000) / (now - last)).toFixed(0); frames = 0; last = now; }
  });
})();
