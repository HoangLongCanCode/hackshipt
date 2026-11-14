'use client';

import type { QuestDTO, SponsorDTO } from '@/lib/contracts';

export interface QuestMapProps {
  quests: QuestDTO[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  revealedDistricts?: string[];
  userLocation?: { lat: number; lng: number } | null;
  sponsors?: SponsorDTO[];
  className?: string;
}

/** PLACEHOLDER (Phase 1). Phase 4 replaces this with the three.js scene. */
export default function QuestMap({ quests, selectedId, onSelect, className }: QuestMapProps) {
  return (
    <div className={className} style={{ padding: 16 }}>
      <p style={{ color: 'var(--muted)' }}>Map placeholder</p>
      <ul>
        {quests.map((q) => (
          <li key={q.id}>
            <button onClick={() => onSelect?.(q.id === selectedId ? null : q.id)} style={{ fontWeight: q.id === selectedId ? 700 : 400 }}>
              {q.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
