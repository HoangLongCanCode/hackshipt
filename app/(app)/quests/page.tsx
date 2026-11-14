'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, EmptyState, SkeletonCard } from '@/components/ui';
import { QuestCard } from '@/components/quest';
import ChainProgress from '@/components/social/ChainProgress';
import { useChains, useQuests } from '@/lib/client/api';
import type { QuestDTO } from '@/lib/contracts';

type Tab = 'all' | 'mine';
const ACTIVE = ['ACCEPTED', 'CHECKED_IN'];

export default function QuestsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('all');
  const { data: quests, error, mutate } = useQuests();
  const { data: chains } = useChains();
  const open = (id: string) => router.push(`/quest/${id}`);

  const active = (quests ?? []).filter((q) => q.myStatus && ACTIVE.includes(q.myStatus));
  const done = (quests ?? []).filter((q) => q.myStatus === 'COMPLETED');
  const mineCount = active.length + done.length;

  const list = (items: QuestDTO[]) => items.map((q) => <QuestCard key={q.id} quest={q} onClick={() => open(q.id)} />);

  return (
    <div className="space-y-4 px-4 pb-28 pt-24">
      <div className="flex gap-2" role="tablist" aria-label="Quest views">
        <Button size="sm" variant={tab === 'all' ? 'primary' : 'secondary'} role="tab" aria-selected={tab === 'all'} onClick={() => setTab('all')}>
          All quests
        </Button>
        <Button size="sm" variant={tab === 'mine' ? 'primary' : 'secondary'} role="tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')} data-testid="tab-mine">
          My activities{mineCount > 0 ? ` (${mineCount})` : ''}
        </Button>
      </div>

      {error ? (
        <EmptyState emoji="😵" title="Couldn't load quests" action={<Button onClick={() => mutate()}>Try again</Button>} />
      ) : !quests ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : tab === 'mine' ? (
        <div className="space-y-4" data-testid="my-activities">
          {mineCount === 0 && (
            <EmptyState emoji="🧭" title="No activities yet" message="Sign up for a quest and it shows up here." action={<Button onClick={() => setTab('all')}>Browse quests</Button>} />
          )}
          {active.length > 0 && (
            <section className="space-y-3">
              <h2 className="cz-display text-xl">Signed up ({active.length})</h2>
              {list(active)}
            </section>
          )}
          {done.length > 0 && (
            <section className="space-y-3">
              <h2 className="cz-display text-xl">Completed ({done.length})</h2>
              {list(done)}
            </section>
          )}
        </div>
      ) : (
        <>
          {chains && chains.length > 0 && (
            <section>
              <h2 className="cz-display mb-2 text-xl">Campaigns</h2>
              <div className="flex gap-3 overflow-x-auto pb-2" data-testid="campaigns">
                {chains.map((c) => (
                  <ChainProgress key={c.id} chain={c} onStepClick={open} />
                ))}
              </div>
            </section>
          )}
          <h2 className="cz-display text-xl">All quests</h2>
          {list(quests)}
        </>
      )}
    </div>
  );
}
