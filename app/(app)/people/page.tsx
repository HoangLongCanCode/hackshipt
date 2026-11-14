'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Card, EmptyState, Pill, SkeletonCard, useToast } from '@/components/ui';
import { CLASS_META } from '@/lib/constants';
import type { MatchDTO } from '@/lib/contracts';
import { useLeaderboard, useMatches, useQuests } from '@/lib/client/api';

export default function PeoplePage() {
  const router = useRouter();
  const toast = useToast();
  const { data: matches, error, mutate } = useMatches();
  const { data: quests } = useQuests();
  const { data: board } = useLeaderboard();

  // "Quests you could team up on": open quests that share an interest with the match.
  const teamUps = useMemo(() => {
    const out: Record<string, { id: string; title: string }[]> = {};
    for (const m of matches ?? []) {
      const slugs = new Set(m.sharedInterests.map((i) => i.slug));
      out[m.userId] = (quests ?? [])
        .filter((q) => q.myStatus !== 'COMPLETED' && q.spotsLeft > 0 && q.interestSlugs.some((s) => slugs.has(s)))
        .slice(0, 2)
        .map((q) => ({ id: q.id, title: q.title }));
    }
    return out;
  }, [matches, quests]);

  // Wave is toast-only: nothing persists and there is no chat (SYSTEM.md §2).
  const wave = (m: MatchDTO) => toast.success(`You waved at ${m.displayName} 👋`);

  return (
    <div className="space-y-4 px-4 pb-28 pt-24">
      <h1 className="cz-display text-2xl">Adventurers like you</h1>
      {error ? (
        <EmptyState emoji="😵" title="Couldn't load matches" action={<Button onClick={() => mutate()}>Try again</Button>} />
      ) : !matches ? (
        <><SkeletonCard /><SkeletonCard /></>
      ) : matches.length === 0 ? (
        <EmptyState emoji="🧭" title="No matches yet" message="Pick a few interests on your profile." />
      ) : (
        matches.map((m) => (
          <Card key={m.userId} className="space-y-2" data-testid="match-card">
            <div className="flex items-center gap-3">
              <Avatar emoji={m.avatarEmoji} size={48} />
              <div className="min-w-0 flex-1">
                <div className="font-bold">{m.displayName}</div>
                <div className="text-xs text-muted">Level {m.level} {CLASS_META[m.avatarClass].label}</div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => wave(m)}>Wave 👋</Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {m.sharedInterests.map((i) => <Pill key={i.slug} tone="coral">{i.emoji} {i.label}</Pill>)}
            </div>
            <div className="text-sm">{m.reason}</div>
            {teamUps[m.userId]?.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-bold text-muted">Quests you could team up on</div>
                <div className="flex flex-wrap gap-1">
                  {teamUps[m.userId].map((q) => (
                    <button key={q.id} type="button" onClick={() => router.push(`/quest/${q.id}`)}><Pill tone="sky">{q.title}</Pill></button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))
      )}
      {board && board.length > 0 && (
        <section>
          <h2 className="cz-display mb-2 text-xl">Top adventurers</h2>
          <Card className="space-y-1 text-sm" data-testid="leaderboard">
            {board.slice(0, 5).map((r) => (
              <div key={r.rank} className="flex items-center justify-between">
                <span>{r.rank}. {r.avatarEmoji} {r.displayName}</span>
                <span className="text-muted">Lv {r.level} · {r.xp} XP</span>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
