'use client';

import { useState } from 'react';
import QuestMap from '@/components/map/QuestMap';
import { MOCK_QUESTS, MOCK_SPONSORS } from '@/lib/mock/data';

export default function DevMap() {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div>
      <p className="p-2 text-sm text-muted">Selected: {sel ?? 'none'}</p>
      <QuestMap quests={MOCK_QUESTS} selectedId={sel} onSelect={setSel} sponsors={MOCK_SPONSORS} />
    </div>
  );
}
