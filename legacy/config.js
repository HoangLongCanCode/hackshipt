// Map settings. (Google/Cesium keys removed: the map now uses MapLibre + OpenStreetMap data, no API key needed.)
window.RPGB_CONFIG = {

  // Full-city start view.
  overview: { lat: 33.52, lon: -86.81, range: 24000, heading: 0, pitch: -62 },

  // Birmingham playable area (degrees). Everything outside is clipped away and the camera can't leave it.
  bounds: { west: -86.92, south: 33.43, east: -86.70, north: 33.62 },
  maxAltitude: 26000,   // m; stops zooming out to the whole region

  // Approx. street-level ellipsoid height (m) near Birmingham; Cyberpunk uses it to tell rooftops from roads.
  groundHeight: 160,

  // sse = tile detail threshold (higher = coarser/lighter). GTA keeps the original quality.
  quality: { sse: 16, resolutionScale: 1.0, cyberSSE: 40, cyberResolutionScale: 0.9 },
};
