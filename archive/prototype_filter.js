(async function () {
  const cfg = window.RPGB_CONFIG;
  const $ = (id) => document.getElementById(id);
  const msg = (t) => ($("msg").textContent = t);

  if (!cfg.googleApiKey && !cfg.cesiumIonToken) {
    msg("Add a Google Map Tiles API key or Cesium ion token to config.js, then reload.");
    return;
  }
  if (cfg.googleApiKey) Cesium.GoogleMaps.defaultApiKey = cfg.googleApiKey;
  if (cfg.cesiumIonToken) Cesium.Ion.defaultAccessToken = cfg.cesiumIonToken;

  const q = cfg.quality;
  const viewer = new Cesium.Viewer("cesiumContainer", {
    baseLayer: false, baseLayerPicker: false, geocoder: false, homeButton: false,
    sceneModePicker: false, navigationHelpButton: false, animation: false, timeline: false,
    fullscreenButton: false, selectionIndicator: false, infoBox: false,
    requestRenderMode: false,
  });
  const scene = viewer.scene;

  // --- Lightweight rendering settings (phone-friendly) ---
  scene.globe.show = false;            // Google tiles include terrain
  scene.skyAtmosphere.show = true;     // original look
  scene.msaaSamples = 4;
  viewer.resolutionScale = q.resolutionScale;
  scene.screenSpaceCameraController.enableCollisionDetection = true;
  scene.screenSpaceCameraController.minimumZoomDistance = 40;
  scene.screenSpaceCameraController.maximumZoomDistance = cfg.maxAltitude;

  // --- Photorealistic 3D Tiles (Google) ---
  const t0 = performance.now();
  let tileset;
  try {
    tileset = await Cesium.createGooglePhotorealistic3DTileset(
      cfg.googleApiKey ? { key: cfg.googleApiKey } : undefined
    );
    scene.primitives.add(tileset);
  } catch (e) {
    console.error(e);
    msg("Failed to load tiles: " + e.message);
    return;
  }
    // Clip everything outside the Birmingham bounds (only the city is drawn).
  const B = cfg.bounds;
  try {
    tileset.clippingPolygons = new Cesium.ClippingPolygonCollection({
      inverse: true, // clip regions OUTSIDE the polygon
      polygons: [new Cesium.ClippingPolygon({
        positions: Cesium.Cartesian3.fromDegreesArray([B.west, B.south, B.east, B.south, B.east, B.north, B.west, B.north]),
      })],
    });
  } catch (e) { console.warn("Clipping unavailable:", e); }
  const clampRect = Cesium.Rectangle.fromDegrees(B.west, B.south, B.east, B.north);

  tileset.allTilesLoaded.addEventListener(() => {
    if ($("load").textContent === "loading…") {
      $("load").textContent = ((performance.now() - t0) / 1000).toFixed(1) + "s";
    }
  });

  // --- Visual styles (post-process shaders) ---
  // GTA-ish: desaturate a bit, posterize into flat color bands, punch contrast,
  // warm shadows / cool highlights, vignette. Cheap: one full-screen pass.
  const styleShader = `
    uniform sampler2D colorTexture;
    uniform float u_sat; uniform float u_levels; uniform float u_contrast;
    uniform vec3 u_shadow; uniform vec3 u_light; uniform float u_vig;
    in vec2 v_textureCoordinates;
    void main() {
      vec4 c = texture(colorTexture, v_textureCoordinates);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      vec3 g = mix(vec3(l), c.rgb, u_sat);
      g = floor(g * u_levels + 0.5) / u_levels;
      g = (g - 0.5) * u_contrast + 0.5;
      g *= mix(u_shadow, u_light, smoothstep(0.15, 0.85, l));
      vec2 d = v_textureCoordinates - 0.5;
      g *= 1.0 - u_vig * dot(d, d) * 2.0;
      out_FragColor = vec4(clamp(g, 0.0, 1.0), c.a);
    }`;
  // Cyberpunk: rebuild the look from depth. World position -> surface normal and
  // height above street level. Walls = cyan, rooftops = bright cyan, street-level
  // gray surfaces = glowing yellow "roads", everything else = dark navy with a faint
  // grid; depth discontinuities get a neon outline. Coarser tiles (higher SSE) give
  // the low-detail blocky buildings.
  const cyberShader = `
    uniform sampler2D colorTexture;
    uniform sampler2D depthTexture;
    uniform float u_ref;      // street-level ellipsoid height (m)
    uniform float u_camH;     // camera ellipsoid height (m)
    uniform vec3 u_up;        // local up at camera (unit, ECEF)
    uniform float u_edge;     // depth-edge sensitivity (smaller = more lines)
    uniform float u_crease;   // roof/wall crease sensitivity
    uniform float u_dbg;
    in vec2 v_textureCoordinates;

    float eyeZ(vec2 uv) {
      float dd = czm_readDepth(depthTexture, uv);
      return czm_windowToEyeCoordinates(uv * czm_viewport.zw, min(dd, 0.99999)).z;
    }
    void main() {
      vec2 uv = v_textureCoordinates;
      vec2 px = 1.0 / czm_viewport.zw;
      vec4 c = texture(colorTexture, uv);
      float d = czm_readDepth(depthTexture, uv);
      bool sky = d >= 1.0;
      vec4 eye = czm_windowToEyeCoordinates(gl_FragCoord.xy, min(d, 0.99999));
      // Camera-relative world vector (precise; avoids 6.3e6 m magnitudes in float32).
      vec3 w = mat3(czm_inverseView) * eye.xyz;
      vec3 up = u_up;
      vec3 n = normalize(cross(dFdx(w), dFdy(w)) + 1e-9);
      float upness = abs(dot(n, up));
      float vu = dot(w, up);
      float hor2 = max(dot(w, w) - vu * vu, 0.0);
      float h = u_camH + vu + hor2 / (2.0 * 6371000.0) - u_ref;   // height above street level
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      float mx = max(c.r, max(c.g, c.b));
      float sat = (mx - min(c.r, min(c.g, c.b))) / (mx + 1e-4);

      // Dark flat fill: buildings only get a faint height glow, no texture detail.
      vec3 col = vec3(0.02, 0.05, 0.11);
      float tall = smoothstep(10.0, 140.0, h);
      col += vec3(0.00, 0.10, 0.14) * tall;
      if (upness < 0.6) col += vec3(0.00, 0.05, 0.08);          // walls a touch lighter

      // Thin lines: 1px depth edges (silhouettes) + creases (roof/wall corners).
      float z0 = eye.z;
      float dz = max(max(abs(eyeZ(uv + vec2(px.x, 0.0)) - z0), abs(eyeZ(uv - vec2(px.x, 0.0)) - z0)),
                     max(abs(eyeZ(uv + vec2(0.0, px.y)) - z0), abs(eyeZ(uv - vec2(0.0, px.y)) - z0)));
      float depthEdge = smoothstep(u_edge, u_edge * 1.6, dz / max(-z0, 1.0));
      float crease = smoothstep(u_crease, u_crease * 1.5, length(fwidth(n)));
      float line = clamp(max(depthEdge, crease * step(8.0, h)), 0.0, 1.0);
      col = mix(col, vec3(0.25, 0.95, 1.0), line);

      // Streets: dim yellow, only at street level.
      if (!sky && upness > 0.8 && h < 18.0 && sat < 0.28 && l > 0.3) col = mix(col, vec3(0.75, 0.6, 0.1), 0.55);

      if (u_dbg > 0.5) {
        float v = u_dbg < 1.5 ? (d - 0.99) * 100.0 : u_dbg < 2.5 ? -eye.z / 30000.0 : u_dbg < 3.5 ? h / 300.0 : upness;
        out_FragColor = vec4(vec3(clamp(v, 0.0, 1.0)), 1.0); return;
      }
      vec3 skyCol = mix(vec3(0.02, 0.05, 0.12), vec3(0.04, 0.12, 0.24), uv.y);
      out_FragColor = vec4(sky ? skyCol : clamp(col, 0.0, 1.0), 1.0);
    }`;
  const groundRef = Cesium.Cartesian3.magnitude(
    Cesium.Cartesian3.fromDegrees(cfg.overview.lon, cfg.overview.lat, cfg.groundHeight)
  );
  const styles = {
    gta: {
      stage: new Cesium.PostProcessStage({ fragmentShader: styleShader, uniforms: {
        u_sat: 0.85, u_levels: 7.0, u_contrast: 1.25,
        u_shadow: new Cesium.Cartesian3(1.1, 0.88, 0.75), u_light: new Cesium.Cartesian3(0.92, 1.0, 1.1), u_vig: 0.55 } }),
      sse: q.sse, scale: q.resolutionScale,
    },
    cyber: {
      stage: new Cesium.PostProcessStage({ fragmentShader: cyberShader, uniforms: {
        u_ref: () => cfg.groundHeight,
        u_camH: () => viewer.camera.positionCartographic.height,
        u_up: () => Cesium.Cartesian3.normalize(viewer.camera.positionWC, new Cesium.Cartesian3()),
        u_edge: 0.03, u_crease: 0.5,
        u_dbg: Number(new URLSearchParams(location.search).get("dbg") || 0),
      } }),
      sse: 56, scale: q.cyberResolutionScale,   // coarser tiles = lower-poly buildings
    },
  };
  let activeStyle = null;
  function setStyle(name) {
    if (!styles[name]) name = "gta";
    if (activeStyle) scene.postProcessStages.remove(activeStyle.stage);
    activeStyle = styles[name];
    scene.postProcessStages.add(activeStyle.stage);
    tileset.maximumScreenSpaceError = activeStyle.sse;
    viewer.resolutionScale = activeStyle.scale;
    document.querySelectorAll("[data-style]").forEach((b) => b.classList.toggle("on", b.dataset.style === name));
  }
  document.querySelectorAll("[data-style]").forEach((b) => (b.onclick = () => setStyle(b.dataset.style)));
  setStyle("cyber"); // prototype tab always starts in the experimental Cyberpunk look

  // --- Camera: start with a view over all of Birmingham ---
  const o = cfg.overview;
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(o.lon, o.lat, 150),
    orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
  });
  viewer.camera.lookAt(
    Cesium.Cartesian3.fromDegrees(o.lon, o.lat, 150),
    new Cesium.HeadingPitchRange(Cesium.Math.toRadians(o.heading), Cesium.Math.toRadians(o.pitch), o.range)
  );
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

  // --- WASD / QE free-fly (desktop; touch uses default gestures) ---
  const keys = new Set();
  addEventListener("keydown", (e) => keys.add(e.code));
  addEventListener("keyup", (e) => keys.delete(e.code));
  addEventListener("blur", () => keys.clear());
  viewer.clock.onTick.addEventListener(() => {
    const cam = viewer.camera;
    // Keep the camera over Birmingham.
    const pc = cam.positionCartographic;
    const lon = Cesium.Math.clamp(pc.longitude, clampRect.west, clampRect.east);
    const lat = Cesium.Math.clamp(pc.latitude, clampRect.south, clampRect.north);
    if (lon !== pc.longitude || lat !== pc.latitude) {
      cam.setView({
        destination: Cesium.Cartesian3.fromRadians(lon, lat, pc.height),
        orientation: { heading: cam.heading, pitch: cam.pitch, roll: cam.roll },
      });
    }
    let speed = Math.max(5, cam.positionCartographic.height - 150) * 0.03;
    if (keys.has("ShiftLeft") || keys.has("ShiftRight")) speed *= 4;
    if (keys.has("KeyW")) cam.moveForward(speed);
    if (keys.has("KeyS")) cam.moveBackward(speed);
    if (keys.has("KeyA")) cam.moveLeft(speed);
    if (keys.has("KeyD")) cam.moveRight(speed);
    if (keys.has("KeyE")) cam.moveUp(speed);
    if (keys.has("KeyQ")) cam.moveDown(speed);
  });

  // --- FPS ---
  let frames = 0, last = performance.now();
  scene.postRender.addEventListener(() => {
    frames++;
    const now = performance.now();
    if (now - last >= 500) {
      $("fps").textContent = ((frames * 1000) / (now - last)).toFixed(0);
      frames = 0; last = now;
    }
  });
})();
