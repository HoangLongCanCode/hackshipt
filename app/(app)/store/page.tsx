'use client';

import { useState } from 'react';
import { Button, Card, EmptyState, Modal, SkeletonCard, useToast } from '@/components/ui';
import { CreditPill } from '@/components/shell';
import { ApiError, type OfferDTO, type RedemptionDTO } from '@/lib/contracts';
import { redeem, useMe, useStore } from '@/lib/client/api';

export default function StorePage() {
  const toast = useToast();
  const { data: me } = useMe();
  const { data, error, mutate } = useStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [ticket, setTicket] = useState<RedemptionDTO | null>(null);

  async function buy(o: OfferDTO) {
    setBusy(o.id);
    try {
      setTicket(await redeem(o.id));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not redeem');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4 px-4 pb-28 pt-24">
      <h1 className="cz-display text-2xl">Sponsor store</h1>
      {error ? (
        <EmptyState emoji="😵" title="Couldn't load the store" action={<Button onClick={() => mutate()}>Try again</Button>} />
      ) : !data ? (
        <SkeletonCard />
      ) : (
        data.sponsors.map((s) => (
          <Card key={s.id} className="space-y-2">
            <div className="font-bold">{s.emoji} {s.name}</div>
            <div className="text-sm text-muted">{s.description}</div>
            {s.offers.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-2 rounded-2xl bg-surface-2 p-3" data-testid="offer">
                <div className="min-w-0">
                  <div className="text-sm font-bold">{o.title}</div>
                  <div className="text-xs text-muted">{o.stock} left</div>
                </div>
                <Button size="sm" variant="gold" loading={busy === o.id} disabled={o.stock <= 0 || (me ? me.credits < o.costCredits : false)} onClick={() => buy(o)}>
                  {o.costCredits} C
                </Button>
              </div>
            ))}
          </Card>
        ))
      )}
      <Modal open={!!ticket} onClose={() => setTicket(null)} title="Redeemed!" tone="gold" confetti>
        {ticket && (
          <div className="space-y-3 text-center" data-testid="redeem-ticket">
            <div className="text-sm">{ticket.offer.title} @ {ticket.sponsorName}</div>
            <div className="cz-display text-3xl tracking-widest" data-testid="redeem-code">{ticket.code}</div>
            <div className="text-xs text-muted">Show this code at the counter. Balance:</div>
            <CreditPill credits={ticket.balance} />
            <Button block onClick={() => setTicket(null)}>Done</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
