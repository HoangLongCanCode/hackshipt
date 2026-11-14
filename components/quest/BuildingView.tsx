'use client';

import { useState } from 'react';
import { ExternalLink, Eye } from 'lucide-react';
import type { QuestDTO } from '@/lib/contracts';

type Where = Pick<QuestDTO, 'lat' | 'lng' | 'address' | 'neighborhood' | 'org'>;

/** Google Maps deep link by coordinates (seeded addresses are fictional "(demo)" strings, so lat/lng is the reliable key). */
export function googleMapsUrl(q: Pick<Where, 'lat' | 'lng'>) {
  return `https://www.google.com/maps/search/?api=1&query=${q.lat},${q.lng}`;
}

/** Opens Google Street View at the spot (a plain link: no embed, no API key, nothing to break offline). */
export function streetViewUrl(q: Pick<Where, 'lat' | 'lng'>) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${q.lat},${q.lng}`;
}

/**
 * Photo of the place (Wikimedia Commons, stored on the org) + Google Maps / Street View links.
 * No photo, or it fails to load (offline demo): a decorative banner, so the card never looks broken.
 */
export default function BuildingView({ quest }: { quest: Where }) {
  const [failed, setFailed] = useState(false);
  const photo = quest.org.imageUrl;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface" data-testid="building-view">
      {photo && !failed ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt={`${quest.org.name}, ${quest.neighborhood}, Birmingham`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="h-40 w-full object-cover"
          />
          <span className="absolute bottom-1 right-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white">Photo: Wikimedia Commons</span>
        </div>
      ) : (
        <div className="flex h-28 flex-col items-center justify-center gap-1 bg-surface-2" data-testid="building-fallback">
          <span className="text-4xl" aria-hidden>{quest.org.emoji}</span>
          <span className="text-xs font-bold text-muted">{quest.org.name} · {quest.neighborhood}</span>
        </div>
      )}
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm font-bold">
        <span className="min-w-0 truncate">📍 {quest.address}</span>
        <span className="flex shrink-0 items-center gap-3">
          <a href={streetViewUrl(quest)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted" data-testid="streetview-link">
            <Eye size={14} aria-hidden /> Street view
          </a>
          <a href={googleMapsUrl(quest)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent" data-testid="gmaps-link">
            Google Maps <ExternalLink size={14} aria-hidden />
          </a>
        </span>
      </div>
    </div>
  );
}
