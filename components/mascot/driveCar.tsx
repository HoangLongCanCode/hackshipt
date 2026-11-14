'use client';

/**
 * Drives the paper-cartoon avocado car across a MapLibre map from A to B while the camera follows it.
 * Framework-free entry point so QuestMap (or any other map) only needs one call:
 *
 *   const drive = startDrive(map, ml, { from: [lng, lat], to: [lng, lat], zoomTo: 15.8, padding });
 *   drive.position()   // [lng, lat] right now (use as the next trip's start)
 *   drive.cancel()     // stop and remove everything; returns the current position
 */
import { createRoot, type Root } from 'react-dom/client';
import type { Map as MLMap, Marker, PaddingOptions } from 'maplibre-gl';
import { AvocadoCar } from './AvocadoCar';

type LngLat = [number, number];

export interface DriveOptions {
  from: LngLat;
  to: LngLat;
  /** Camera zoom on arrival (never zooms out past the current zoom). */
  zoomTo: number;
  /** Camera pitch on arrival. Default 60. */
  pitchTo?: number;
  /** Camera padding on arrival (e.g. room for the bottom sheet). */
  padding?: PaddingOptions;
  /** Fired once the car has parked. */
  onArrive?: () => void;
  /** Speech-bubble text on arrival. Pass '' to skip. Default "Quest time!". */
  bubble?: string;
}

export interface DriveHandle {
  position(): LngLat;
  cancel(): LngLat;
}

const SRC = 'avo-drive-route';
const LAYERS = ['avo-drive-route-casing', 'avo-drive-route-dash'];
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Rough distance in km (good enough for sizing the animation). */
function km(a: LngLat, b: LngLat) {
  const dx = (a[0] - b[0]) * 111.32 * Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180);
  const dy = (a[1] - b[1]) * 110.57;
  return Math.hypot(dx, dy);
}

export function startDrive(map: MLMap, ml: typeof import('maplibre-gl'), opts: DriveOptions): DriveHandle {
  const { from, to, zoomTo, pitchTo = 60, padding, onArrive, bubble = 'Quest time!' } = opts;
  const dist = km(from, to);
  const duration = clamp(1700 + dist * 380, 1700, 3400);

  // gentle arc: control point pushed sideways from the midpoint
  const mid: LngLat = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const side = dist < 0.05 ? 0 : 0.16;
  const ctrl: LngLat = [mid[0] - dy * side, mid[1] + dx * side];
  const at = (t: number): LngLat => {
    const u = 1 - t;
    return [u * u * from[0] + 2 * u * t * ctrl[0] + t * t * to[0], u * u * from[1] + 2 * u * t * ctrl[1] + t * t * to[1]];
  };

  // ---- dashed "treasure map" route ----
  const line = Array.from({ length: 41 }, (_, i) => at(i / 40));
  const geo = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line } };
  try {
    if (map.getSource(SRC)) (map.getSource(SRC) as unknown as { setData(d: unknown): void }).setData(geo);
    else map.addSource(SRC, { type: 'geojson', data: geo as never });
    if (!map.getLayer(LAYERS[0])) {
      map.addLayer({ id: LAYERS[0], type: 'line', source: SRC, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#4a3328', 'line-width': 7, 'line-opacity': 0.9 } });
      map.addLayer({ id: LAYERS[1], type: 'line', source: SRC, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fffdf6', 'line-width': 3.5, 'line-dasharray': [1.2, 1.6] } });
    }
  } catch {
    /* route is decoration only */
  }
  const removeRoute = () => {
    try {
      LAYERS.forEach((id) => map.getLayer(id) && map.removeLayer(id));
      if (map.getSource(SRC)) map.removeSource(SRC);
    } catch {}
  };

  // ---- the car marker ----
  const host = document.createElement('div');
  host.className = 'avo-drive';
  const rot = document.createElement('div');
  rot.className = 'avo-drive__rot';
  host.appendChild(rot);
  const root: Root = createRoot(rot);
  root.render(<AvocadoCar size={120} />);
  const marker: Marker = new ml.Marker({ element: host, anchor: 'center' }).setLngLat(from).addTo(map);

  // ---- camera ----
  const z0 = map.getZoom(), p0 = map.getPitch();
  const zEnd = Math.max(z0, zoomTo);
  const pad0 = map.getPadding();
  const dip = clamp(dist * 0.4, 0, 1.4); // zoom out a bit mid-trip so long rides read as a journey
  let following = true;
  const stopFollow = () => { following = false; };
  (['mousedown', 'touchstart', 'wheel'] as const).forEach((ev) => map.on(ev, stopFollow));

  let pos = from;
  let angle = 0, flip = 1;
  let raf = 0, done = false;
  const t0 = performance.now();

  const frame = (now: number) => {
    const t = clamp((now - t0) / duration, 0, 1);
    const te = easeInOut(t);
    pos = at(te);
    marker.setLngLat(pos);

    // heading from the screen-space tangent (flip instead of driving upside down)
    const a = map.project(pos), b = map.project(at(Math.min(1, te + 0.02)));
    let target = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    if (Math.abs(b.x - a.x) + Math.abs(b.y - a.y) > 0.5) {
      const wantFlip = Math.abs(target) > 90 ? -1 : 1;
      if (wantFlip === -1) target = target > 0 ? target - 180 : target + 180;
      flip = wantFlip;
      angle = lerp(angle, clamp(target, -35, 35), 0.25);
    }
    rot.style.transform = `scaleX(${flip}) rotate(${flip * angle}deg)`;

    if (following) {
      map.jumpTo({
        center: pos,
        zoom: lerp(z0, zEnd, te) - dip * Math.sin(Math.PI * t),
        pitch: lerp(p0, pitchTo, te),
        padding: padding
          ? { top: lerp(pad0.top, padding.top, te), bottom: lerp(pad0.bottom, padding.bottom, te), left: lerp(pad0.left, padding.left, te), right: lerp(pad0.right, padding.right, te) }
          : undefined,
      });
    }

    if (t < 1) {
      raf = requestAnimationFrame(frame);
      return;
    }
    arrive();
  };

  let timers: number[] = [];
  const teardown = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    timers = [];
    (['mousedown', 'touchstart', 'wheel'] as const).forEach((ev) => map.off(ev, stopFollow));
    marker.remove();
    removeRoute();
    window.setTimeout(() => root.unmount(), 0);
  };

  function arrive() {
    onArrive?.();
    if (bubble) {
      const b = document.createElement('div');
      b.className = 'avo-drive__bubble';
      b.textContent = bubble;
      host.appendChild(b);
    }
    timers.push(window.setTimeout(() => rot.classList.add('is-leaving'), 1100));
    timers.push(window.setTimeout(teardown, 1700));
  }

  raf = requestAnimationFrame(frame);

  return {
    position: () => pos,
    cancel: () => {
      teardown();
      return pos;
    },
  };
}
