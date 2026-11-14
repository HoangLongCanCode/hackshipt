'use client';

import { useState } from 'react';
import { Button, Card, EmptyState, ProgressBar, SkeletonCard, useToast } from '@/components/ui';
import { ApiError } from '@/lib/contracts';
import { donate, useCauses, useMe } from '@/lib/client/api';

export default function DonatePage() {
  const toast = useToast();
  const { data: me } = useMe();
  const { data: causes, error, mutate } = useCauses();
  const [busy, setBusy] = useState<string | null>(null);
  const [amount, setAmount] = useState(10);

  async function give(causeId: string) {
    setBusy(causeId);
    try {
      await donate(causeId, amount);
      toast.reward(`Donated ${amount} credits. Thank you!`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not donate');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4 px-4 pb-28 pt-24">
      <h1 className="cz-display text-2xl">Give back</h1>
      <div className="flex gap-2" data-testid="amounts">
        {[5, 10, 25].map((a) => (
          <Button key={a} size="sm" variant={amount === a ? 'primary' : 'secondary'} onClick={() => setAmount(a)}>{a}</Button>
        ))}
      </div>
      {error ? (
        <EmptyState emoji="😵" title="Couldn't load causes" action={<Button onClick={() => mutate()}>Try again</Button>} />
      ) : !causes ? (
        <SkeletonCard />
      ) : (
        causes.map((c) => (
          <Card key={c.id} className="space-y-2" data-testid="cause">
            <div className="font-bold">{c.title}</div>
            <div className="text-xs text-muted">{c.orgName}</div>
            <p className="text-sm">{c.description}</p>
            <ProgressBar value={(c.raisedCredits / c.goalCredits) * 100} tone="gold" label="Cause progress" />
            <div className="flex items-center justify-between text-sm">
              <span data-testid="raised">{c.raisedCredits} / {c.goalCredits} credits</span>
              <Button size="sm" variant="gold" loading={busy === c.id} disabled={!me || me.credits < amount} onClick={() => give(c.id)}>
                Give {amount}
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
