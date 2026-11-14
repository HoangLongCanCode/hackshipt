'use client';

import { AvatarStack, Pill } from '@/components/ui';
import type { QuestDetailDTO } from '@/lib/contracts';

/** "3 of 6 spots filled" + teammates' levels. Only meaningful for group quests (capacity > 1). */
export default function PartyStrip({ quest }: { quest: QuestDetailDTO }) {
  if (quest.capacity <= 1) return null;
  const filled = quest.capacity - quest.spotsLeft;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3" data-testid="party-strip">
      <AvatarStack items={quest.party.map((p) => ({ id: p.userId, emoji: p.avatarEmoji, name: p.displayName }))} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">
          {filled} of {quest.capacity} spots filled
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {quest.party.length === 0 && <span className="text-xs text-muted">Be the first to join the party</span>}
          {quest.party.map((p) => (
            <Pill key={p.userId} tone="outline">
              {p.avatarEmoji} {p.displayName} · Lv {p.level}
            </Pill>
          ))}
        </div>
      </div>
    </div>
  );
}
