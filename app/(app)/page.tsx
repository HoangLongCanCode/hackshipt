'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, ListFilter, X } from 'lucide-react';
import { Button, Sheet, SkeletonCard, type SheetSnap } from '@/components/ui';
import { QuestSheet } from '@/components/quest';
import QuestSidebar from '@/components/quest/QuestSidebar';
import type { Category } from '@/lib/contracts';
import { matchesDate, type DateFilter } from '@/lib/dates';
import { AnimationToggle, useAnimationPref } from '@/components/mascot';
import { useMe, useQuest, useQuests } from '@/lib/client/api';

// MapLibre needs the browser: never render the canvas on the server.
const QuestMap = dynamic(() => import('@/components/map/QuestMap'), { ssr: false });

export default function MapHome() {
  const [category, setCategory] = useState<Category | undefined>();
  const [selected, setSelected] = useState<string | null>(null);
  const [snap, setSnap] = useState<SheetSnap>('full');
  const [sidebar, setSidebar] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ kind: 'any' });
  const [area, setArea] = useState<{ name: string; raw: string } | null>(null);
  const [membership, setMembership] = useState<Record<string, string>>({});
  const [rideAnimation] = useAnimationPref();
  const { data: me } = useMe();
  const { data: allQuests, error, mutate } = useQuests(category ? { category } : undefined);
  const quests = useMemo(() => allQuests?.filter((q) => matchesDate(q, dateFilter)), [allQuests, dateFilter]);
  const { data: detail } = useQuest(selected);

  const inArea = useMemo(() => (area ? (quests ?? []).filter((q) => membership[q.id] === area.name) : quests), [quests, area, membership]);

  const select = useCallback((id: string | null) => {
    setSelected(id);
    // The sheet opens full (latest map behavior). With the ride on, hold it at peek until the car parks
    // so the drive stays visible, then onDriveArrive snaps it open.
    if (id) { setSnap(rideAnimation ? 'peek' : 'full'); setSidebar(false); }
  }, [rideAnimation]);

  return (
    <div className="fixed inset-0">
      <QuestMap
        className="absolute inset-0"
        quests={quests ?? []}
        selectedId={selected}
        onSelect={select}
        revealedDistricts={me?.revealedDistricts}
        area={area}
        onAreaSelect={(a) => { setArea(a); if (a) setSelected(null); }}
        onQuestAreas={setMembership}
        animate={rideAnimation}
        onDriveArrive={() => setSnap('full')}
      />
      {/* below the district chip (top-right) so the two never sit on top of each other */}
      <AnimationToggle className="fixed right-3 top-[84px] z-30" />

      {/* sidebar toggle: small, out of the way */}
      <button
        onClick={() => setSidebar((o) => !o)}
        className="cz-glass fixed left-3 top-[84px] z-30 flex h-11 items-center gap-2 rounded-full px-3 text-sm font-bold"
        aria-label="Open quests and filters"
        aria-expanded={sidebar}
      >
        <ListFilter size={18} />
        Quests{inArea ? <span className="rounded-full bg-[var(--cz-coral)] px-2 text-xs text-white">{inArea.length}</span> : null}
      </button>

      {area && (
        <button
          onClick={() => setArea(null)}
          className="cz-glass fixed right-3 top-3 z-30 flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold"
          aria-label={`Clear ${area.name} filter`}
        >
          {area.name}
          <X size={16} />
        </button>
      )}

      <QuestSidebar
        open={sidebar}
        onClose={() => setSidebar(false)}
        quests={inArea}
        loading={!quests && !error}
        error={!!error}
        onRetry={() => mutate()}
        category={category}
        dateFilter={dateFilter}
        onDate={(f) => { setDateFilter(f); setSelected(null); }}
        onCategory={(c) => { setCategory(c); setSelected(null); }}
        area={area?.name ?? null}
        onClearArea={() => setArea(null)}
        selectedId={selected}
        onSelect={select}
      />

      {selected && (
        <div className="fixed inset-0 z-[25] bg-[rgba(74,51,40,.25)]" onClick={() => select(null)} aria-hidden data-testid="sheet-backdrop" />
      )}
      {selected && (
        <Sheet bottomOffset={88} snap={snap} onSnapChange={setSnap} peekHeight={140}>
          <div className="px-4 pt-1">
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => select(null)}>
              Close
            </Button>
          </div>
          {detail ? <QuestSheet quest={detail} /> : <div className="p-4"><SkeletonCard /></div>}
        </Sheet>
      )}
    </div>
  );
}
