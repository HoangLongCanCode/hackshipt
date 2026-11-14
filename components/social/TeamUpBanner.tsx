'use client';

import { Users } from 'lucide-react';
import type { QuestDetailDTO } from '@/lib/contracts';

/** Nudge shown on group quests that still have room. */
export default function TeamUpBanner({ quest }: { quest: QuestDetailDTO }) {
  if (quest.capacity <= 1 || quest.spotsLeft <= 0 || quest.myStatus === 'COMPLETED') return null;
  const names = quest.party.slice(0, 2).map((p) => p.displayName);
  const more = quest.party.length - names.length;
  const text = names.length
    ? `${names.join(' & ')}${more > 0 ? ` +${more}` : ''} ${names.length > 1 || more > 0 ? 'are' : 'is'} already on this quest. Team up!`
    : 'Group quest: bring a friend and fill the party.';
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 text-sm" data-testid="team-up">
      <Users size={18} aria-hidden /> <span>{text}</span>
    </div>
  );
}
