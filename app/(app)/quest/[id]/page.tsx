'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button, Card, EmptyState, SkeletonCard } from '@/components/ui';
import { QuestSheet } from '@/components/quest';
import { useQuest } from '@/lib/client/api';

export default function QuestPage({ params }: { params: { id: string } }) {
  const { data, error, mutate } = useQuest(params.id);
  return (
    <div className="px-3 pb-28 pt-24">
      <Link href="/quests" className="mb-2 inline-flex items-center gap-1 text-sm text-muted">
        <ArrowLeft size={16} /> Quests
      </Link>
      {error ? (
        <EmptyState emoji="🗺️" title="Quest not found" action={<Button onClick={() => mutate()}>Try again</Button>} />
      ) : !data ? (
        <SkeletonCard />
      ) : (
        <Card hero padded={false}>
          <QuestSheet quest={data} />
        </Card>
      )}
    </div>
  );
}
