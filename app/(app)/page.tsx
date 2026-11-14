'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft } from 'lucide-react';
import { Button, EmptyState, Sheet, SkeletonCard, type SheetSnap } from '@/components/ui';
import { CategoryChip, QuestCard, QuestSheet } from '@/components/quest';
import { CATEGORIES, type Category } from '@/lib/contracts';
import { CATEGORY_META } from '@/lib/constants';
import DemoCodeHint from '@/components/dev/DemoCodeHint';
import { useMe, useQuest, useQuests } from '@/lib/client/api';

// three.js needs the browser: never render the canvas on the server.
const QuestMap = dynamic(() => import('@/components/map/QuestMap'), { ssr: false });

export default function MapHome() {
  const [category, setCategory] = useState<Category | undefined>();
  const [selected, setSelected] = useState<string | null>(null);
  const [snap, setSnap] = useState<SheetSnap>('peek');
  const { data: me } = useMe();
  const { data: quests, error, mutate } = useQuests(category ? { category } : undefined);
  const { data: detail } = useQuest(selected);

  const select = (id: string | null) => {
    setSelected(id);
    setSnap(id ? 'full' : 'peek');
  };

  return (
    <div className="fixed inset-0">
      <QuestMap
        className="absolute inset-0"
        quests={quests ?? []}
        selectedId={selected}
        onSelect={select}
        revealedDistricts={me?.revealedDistricts}
      />
      <div className="absolute inset-x-0 top-[84px] z-20 flex gap-2 overflow-x-auto px-3 pb-1" data-testid="filters">
        {CATEGORIES.map((c) => {
          const m = CATEGORY_META[c];
          return (
            <CategoryChip key={c} label={m.label} emoji={m.emoji} color={m.color} selected={category === c}
              onClick={() => { setCategory(category === c ? undefined : c); select(null); }} />
          );
        })}
      </div>
      <DemoCodeHint questId={selected} />
      <Sheet bottomOffset={88} snap={snap} onSnapChange={setSnap}>
        {selected ? (
          <div>
            <div className="px-4 pt-1">
              <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => select(null)}>
                All quests
              </Button>
            </div>
            {detail ? <QuestSheet quest={detail} /> : <div className="p-4"><SkeletonCard /></div>}
          </div>
        ) : (
          <div className="space-y-3 p-4" data-testid="quest-list">
            {error ? (
              <EmptyState emoji="😵" title="Couldn't load quests" action={<Button onClick={() => mutate()}>Try again</Button>} />
            ) : !quests ? (
              <SkeletonCard />
            ) : quests.length === 0 ? (
              <EmptyState title="No quests here" message="Try another category." />
            ) : (
              quests.map((q) => <QuestCard key={q.id} quest={q} onClick={() => select(q.id)} />)
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
