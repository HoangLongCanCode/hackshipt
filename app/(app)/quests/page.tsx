'use client';

import { useRouter } from 'next/navigation';
import { Button, EmptyState, SkeletonCard } from '@/components/ui';
import { QuestCard } from '@/components/quest';
import ChainProgress from '@/components/social/ChainProgress';
import { useChains, useQuests } from '@/lib/client/api';

export default function QuestsPage() {
  const router = useRouter();
  const { data: quests, error, mutate } = useQuests();
  const { data: chains } = useChains();
  const open = (id: string) => router.push(`/quest/${id}`);

  return (
    <div className="space-y-4 px-4 pb-28 pt-24">
      {chains && chains.length > 0 && (
        <section>
          <h2 className="cz-display mb-2 text-xl">Campaigns</h2>
          <div className="flex gap-3 overflow-x-auto pb-2" data-testid="campaigns">
            {chains.map((c) => <ChainProgress key={c.id} chain={c} onStepClick={open} />)}
          </div>
        </section>
      )}
      <h2 className="cz-display text-xl">All quests</h2>
      {error ? (
        <EmptyState emoji="😵" title="Couldn't load quests" action={<Button onClick={() => mutate()}>Try again</Button>} />
      ) : !quests ? (
        <><SkeletonCard /><SkeletonCard /></>
      ) : (
        quests.map((q) => <QuestCard key={q.id} quest={q} onClick={() => open(q.id)} />)
      )}
    </div>
  );
}
