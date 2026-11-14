'use client';

import { Music, Sparkles } from 'lucide-react';
import type { PartyMemberDTO, QuestDetailDTO } from '@/lib/contracts';
import { useMe } from '@/lib/client/api';

const same = (a?: string, b?: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

export interface Vibe { member: PartyMemberDTO; artist?: string; hobby?: string }

/** Teammates on this quest who share the viewer's favourite artist and/or hobby (viewer excluded). */
export function computeVibes(party: PartyMemberDTO[], me?: { id: string; favoriteArtist?: string; hobby?: string } | null): Vibe[] {
  if (!me) return [];
  return party
    .filter((p) => p.userId !== me.id)
    .map((p) => ({
      member: p,
      artist: same(p.favoriteArtist, me.favoriteArtist) ? p.favoriteArtist : undefined,
      hobby: same(p.hobby, me.hobby) ? p.hobby : undefined,
    }))
    .filter((v) => v.artist || v.hobby)
    .sort((a, b) => Number(!!b.artist) + Number(!!b.hobby) - (Number(!!a.artist) + Number(!!a.hobby)));
}

/** "Maya is going: also into Alabama Shakes and Hiking". Shown on the quest sheet. */
export default function PartyVibes({ quest }: { quest: QuestDetailDTO }) {
  const { data: me } = useMe();
  const vibes = computeVibes(quest.party, me).slice(0, 3);
  if (vibes.length === 0) return null;
  return (
    <div className="space-y-1 rounded-2xl border border-border bg-surface p-3" data-testid="party-vibes">
      <div className="flex items-center gap-1 text-xs font-bold text-muted"><Sparkles size={14} aria-hidden /> You have things in common</div>
      {vibes.map((v) => (
        <div key={v.member.userId} className="flex items-start gap-2 text-sm">
          <span aria-hidden>{v.member.avatarEmoji}</span>
          <span>
            <b>{v.member.displayName}</b> is going
            {v.artist && <> and also listens to <b>{v.artist}</b> <Music size={12} className="inline" aria-hidden /></>}
            {v.artist && v.hobby && <> + </>}
            {!v.artist && v.hobby && <> and </>}
            {v.hobby && <>shares your hobby: <b>{v.hobby}</b></>}
          </span>
        </div>
      ))}
    </div>
  );
}
