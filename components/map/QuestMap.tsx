'use client';

/**
 * The Cyberpunk MapLibre map (OSM roads + buildings, City of Birmingham neighborhoods, Shipt HQ landmark).
 * Same props contract as the original three.js placeholder, so pages don't care which renderer is behind it.
 */
import { useEffect, useRef, useState } from 'react';
import type { Map as MLMap, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map.css';
import type { QuestDTO, SponsorDTO } from '@/lib/contracts';
import { CATEGORY_META } from '@/lib/constants';

export interface QuestMapProps {
  quests: QuestDTO[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  revealedDistricts?: string[];
  userLocation?: { lat: number; lng: number } | null;
  sponsors?: SponsorDTO[];
  className?: string;
}

const BOUNDS = { west: -86.92, south: 33.43, east: -86.70, north: 33.62 };
const SHIPT_HEIGHT = 78;

type Pt = [number, number];
interface Area { raw: string; name: string; polys: Pt[][][]; rects: { w: number; s: number; e: number; n: number }[] }

const inRing = (x: number, y: number, ring: Pt[]) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const fixName = (n: string) => n.replace(/Hghts|Hgts/g, 'Heights').replace(/Hghlands/g, 'Highlands').replace(/Prk/g, 'Park').replace(/\bHts\b/g, 'Heights').replace(/\bVlg\b/g, 'Village');

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const bang = (q: QuestDTO) => (q.myStatus === 'COMPLETED' ? '✓' : q.myStatus === 'ACCEPTED' || q.myStatus === 'CHECKED_IN' ? '▶' : q.spotsLeft === 0 ? '•' : '!');
const pinClass = (q: QuestDTO, sel: boolean) =>
  'qpin' + (q.myStatus === 'COMPLETED' ? ' done' : q.myStatus === 'ACCEPTED' || q.myStatus === 'CHECKED_IN' ? ' mine' : q.spotsLeft === 0 ? ' full' : '') + (sel ? ' sel' : '');

export default function QuestMap({ quests, selectedId, onSelect, className }: QuestMapProps) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const mlRef = useRef<typeof import('maplibre-gl') | null>(null);
  const markers = useRef(new Map<string, Marker>());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [area, setArea] = useState('');

  // ---- build the map once ----
  useEffect(() => {
    let cancelled = false;
    let map: MLMap | null = null;
    (async () => {
      try {
        const ml = await import('maplibre-gl');
        if (cancelled || !host.current) return;
        mlRef.current = ml;
        const load = (u: string) => fetch(u).then((r) => { if (!r.ok) throw new Error(`${u} ${r.status}`); return r.json(); });
        const [roads, buildings, hoods, shipt] = await Promise.all([load('/data/roads.json'), load('/data/buildings.json'), load('/data/neighborhoods.json'), load('/data/shipt.json')]);
        if (cancelled || !host.current) return;

        const sp: Pt[] = shipt.polygon;
        const spBox = sp.reduce((b, [x, y]) => ({ w: Math.min(b.w, x), e: Math.max(b.e, x), s: Math.min(b.s, y), n: Math.max(b.n, y) }), { w: 1e9, e: -1e9, s: 1e9, n: -1e9 });
        const underShipt = (b: { p: Pt[] }) => {
          const cx = b.p.reduce((a, p) => a + p[0], 0) / b.p.length, cy = b.p.reduce((a, p) => a + p[1], 0) / b.p.length;
          return inRing(cx, cy, sp) || (cx >= spBox.w && cx <= spBox.e && cy >= spBox.s && cy <= spBox.n);
        };
        const roadsGJ = { type: 'FeatureCollection', features: roads.filter((r: { c: Pt[] }) => r.c.length > 1).map((r: { c: Pt[]; k: number }) => ({ type: 'Feature', properties: { k: r.k }, geometry: { type: 'LineString', coordinates: r.c } })) };
        const bldGJ = { type: 'FeatureCollection', features: buildings.filter((b: { p: Pt[] }) => !underShipt(b)).map((b: { p: Pt[]; h?: number }) => ({ type: 'Feature', properties: { h: Math.max(5, Math.min(220, b.h || 8)) }, geometry: { type: 'Polygon', coordinates: [b.p] } })) };

        map = new ml.Map({
          container: host.current,
          style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#050b1a' } }] },
          center: [-86.81, 33.52], zoom: 11.6, pitch: 55, bearing: -20, minZoom: 10, maxZoom: 18.5, maxPitch: 80,
          maxBounds: [[BOUNDS.west - 0.02, BOUNDS.south - 0.02], [BOUNDS.east + 0.02, BOUNDS.north + 0.02]],
          antialias: false, fadeDuration: 0, attributionControl: false,
        });
        const m = map;
        mapRef.current = m;
        m.addControl(new ml.AttributionControl({ compact: true, customAttribution: '© OpenStreetMap contributors · City of Birmingham GIS' }));

        m.on('load', () => {
          if (cancelled) return;
          m.addSource('roads', { type: 'geojson', data: roadsGJ as never });
          m.addSource('bld', { type: 'geojson', data: bldGJ as never });
          m.addSource('hoods', { type: 'geojson', data: hoods });
          const byClass = (v0: number | string, v1: number | string, v2: number | string, v3: number | string, v4: number | string) => ['match', ['get', 'k'], 0, v0, 1, v1, 2, v2, 3, v3, v4] as never;
          m.addLayer({ id: 'roads-glow', type: 'line', source: 'roads', layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': '#ffcf1f', 'line-opacity': 0.05, 'line-blur': 4, 'line-width': ['interpolate', ['linear'], ['zoom'], 10, byClass(3, 2.5, 2, 1.5, 1), 17, byClass(14, 12, 10, 8, 6)] as never } });
          m.addLayer({ id: 'roads', type: 'line', source: 'roads', layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': byClass('#b89a2e', '#a88a2a', '#8f742a', '#7a6428', '#66552a'), 'line-opacity': 0.5, 'line-width': ['interpolate', ['linear'], ['zoom'], 10, byClass(1.0, 0.8, 0.6, 0.5, 0.4), 17, byClass(3.0, 2.5, 2.0, 1.6, 1.1)] as never } });
          m.addLayer({ id: 'bld-line', type: 'line', source: 'bld', paint: { 'line-color': '#4ff0ff', 'line-width': 0.5, 'line-opacity': 0.28 } });
          m.addLayer({ id: 'bld', type: 'fill-extrusion', source: 'bld', paint: {
            'fill-extrusion-height': ['get', 'h'], 'fill-extrusion-base': 0,
            'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'h'], 5, '#06303a', 30, '#0a6f80', 90, '#2ee6f5'] as never,
            'fill-extrusion-opacity': 0.92, 'fill-extrusion-vertical-gradient': true } });
          m.addLayer({ id: 'hood-base', type: 'line', source: 'hoods', paint: { 'line-color': '#5ff3ff', 'line-width': 1, 'line-opacity': 0.3 } });
          m.addLayer({ id: 'hood-fill', type: 'fill', source: 'hoods', filter: ['==', 'NAME', ''], paint: { 'fill-color': '#5ff3ff', 'fill-opacity': 0.2 } });
          m.addLayer({ id: 'hood-glow', type: 'line', source: 'hoods', filter: ['==', 'NAME', ''], paint: { 'line-color': '#5ff3ff', 'line-width': 16, 'line-blur': 8, 'line-opacity': 0.6 } });
          m.addLayer({ id: 'hood-line', type: 'line', source: 'hoods', filter: ['==', 'NAME', ''], paint: { 'line-color': '#bffcff', 'line-width': 2.6, 'line-opacity': 1 } });

          m.addSource('shipt', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [sp] } } });
          m.addLayer({ id: 'shipt-glow', type: 'line', source: 'shipt', paint: { 'line-color': '#23cc6b', 'line-width': 18, 'line-blur': 10, 'line-opacity': 0.7 } });
          m.addLayer({ id: 'shipt-bld', type: 'fill-extrusion', source: 'shipt', paint: { 'fill-extrusion-height': SHIPT_HEIGHT, 'fill-extrusion-base': 0, 'fill-extrusion-color': '#23cc6b', 'fill-extrusion-opacity': 0.95, 'fill-extrusion-vertical-gradient': true } });
          m.addLayer({ id: 'shipt-line', type: 'line', source: 'shipt', paint: { 'line-color': '#b9ffd6', 'line-width': 2 } });
          const el = document.createElement('div');
          el.className = 'landmark';
          el.innerHTML = '<div class="badge"><img src="/assets/shipt-logo.svg" alt="Shipt"></div><div class="stem"></div><div class="ring"></div>';
          el.title = shipt.name;
          el.onclick = () => m.flyTo({ center: [shipt.lon, shipt.lat], zoom: 16.3, pitch: 62, duration: 2200 });
          new ml.Marker({ element: el, anchor: 'bottom' }).setLngLat([shipt.lon, shipt.lat]).addTo(m);

          // neighborhood hover/tap picking
          const areas: Area[] = hoods.features.map((f: { geometry: { type: string; coordinates: Pt[][][] | Pt[][] }; properties: { NAME: string } }) => {
            const polys = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) as Pt[][][];
            const rects = polys.map((p) => { let w = 1e9, s = 1e9, e = -1e9, n = -1e9; for (const [x, y] of p[0]) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); } return { w, s, e, n }; });
            return { raw: f.properties.NAME, name: fixName(f.properties.NAME), polys, rects };
          });
          const areaAt = (lon: number, lat: number) => {
            for (const a of areas) for (let k = 0; k < a.polys.length; k++) {
              const r = a.rects[k];
              if (lon < r.w || lon > r.e || lat < r.s || lat > r.n) continue;
              if (inRing(lon, lat, a.polys[k][0])) return a;
            }
            return null;
          };
          let current: Area | null = null;
          const show = (a: Area | null) => {
            if (a === current) return;
            current = a;
            const f = ['==', 'NAME', a ? a.raw : ''] as never;
            ['hood-fill', 'hood-glow', 'hood-line'].forEach((id) => m.setFilter(id, f));
            setArea(a ? a.name : '');
          };
          m.on('mousemove', (e) => show(areaAt(e.lngLat.lng, e.lngLat.lat)));
          m.on('click', (e) => { show(areaAt(e.lngLat.lng, e.lngLat.lat)); });
          setReady(true);
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Map failed to load');
      }
    })();
    return () => {
      cancelled = true;
      markers.current.forEach((mk) => mk.remove());
      markers.current.clear();
      map?.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  // ---- quest pins (diffed by id) ----
  useEffect(() => {
    const map = mapRef.current, ml = mlRef.current;
    if (!ready || !map || !ml) return;
    const seen = new Set<string>();
    for (const q of quests) {
      seen.add(q.id);
      let mk = markers.current.get(q.id);
      const color = CATEGORY_META[q.category].color;
      if (!mk) {
        const el = document.createElement('div');
        el.innerHTML = `<div class="stem"></div><div class="ring"></div><div class="fl"><div class="hex"><i>${CATEGORY_META[q.category].emoji}</i></div><div class="bang"></div></div><div class="lbl">${esc(q.title)}</div>`;
        el.addEventListener('click', (e) => { e.stopPropagation(); onSelectRef.current?.(q.id); });
        mk = new ml.Marker({ element: el, anchor: 'center' }).setLngLat([q.lng, q.lat]).addTo(map);
        markers.current.set(q.id, mk);
      }
      const el = mk.getElement();
      el.style.setProperty('--c', color);
      el.className = `maplibregl-marker ${pinClass(q, q.id === selectedId)}`;
      (el.querySelector('.bang') as HTMLElement).textContent = bang(q);
    }
    markers.current.forEach((mk, id) => { if (!seen.has(id)) { mk.remove(); markers.current.delete(id); } });
  }, [quests, selectedId, ready]);

  // ---- fly to the selected quest ----
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const q = selectedId ? quests.find((x) => x.id === selectedId) : null;
    if (q) {
      map.flyTo({ center: [q.lng, q.lat], zoom: Math.max(map.getZoom(), 15.8), pitch: 60, duration: 1200, padding: { top: 0, left: 0, right: 0, bottom: Math.round(window.innerHeight * 0.4) } });
    } else {
      map.easeTo({ padding: { top: 0, left: 0, right: 0, bottom: 0 }, duration: 500 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, ready]);

  return (
    <div className={className}>
      <div ref={host} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', background: '#050b1a' }} />
      {!ready && !error && <div className="rpgb-maphint">Loading the city…</div>}
      {error && <div className="rpgb-maphint">Map data failed to load: {error}</div>}
      {area && <div className="rpgb-area"><span>District</span>{area}</div>}
    </div>
  );
}
