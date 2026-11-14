'use client';

import { useState } from 'react';
import { Button, Modal, Pill, useToast } from '@/components/ui';
import { CATEGORY_META } from '@/lib/constants';
import { ApiError } from '@/lib/contracts';
import type { CompleteResultDTO, QuestDetailDTO } from '@/lib/contracts';
import { abandonQuest, acceptQuest, checkIn, completeQuest } from '@/lib/client/api';
import BuildingView from './BuildingView';
import PartyVibes from '@/components/social/PartyVibes';
import PartyStrip from '@/components/social/PartyStrip';
import TeamUpBanner from '@/components/social/TeamUpBanner';
import CategoryChip from './CategoryChip';
import DifficultyStars from './DifficultyStars';
import RewardBadge from './RewardBadge';

/** Quest detail + the accept -> check in -> complete flow. Renders inside the bottom sheet or /quest/[id]. */
const navUrl = (q: { lat: number; lng: number }) => `https://www.google.com/maps/dir/?api=1&destination=${q.lat},${q.lng}&travelmode=driving`;

export default function QuestSheet({ quest }: { quest: QuestDetailDTO }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<CompleteResultDTO | null>(null);
  const m = CATEGORY_META[quest.category];
  const st = quest.myStatus;

  async function run<T>(fn: () => Promise<T>, okMsg?: string) {
    setBusy(true);
    try {
      const r = await fn();
      if (okMsg) toast.success(okMsg);
      return r;
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Something went wrong');
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  // Demo mode ignores GPS (SYSTEM.md §6), so we send the quest's own coordinates.
  const doCheckIn = () => run(() => checkIn(quest.id, quest.lat, quest.lng), 'Checked in!');
  const doComplete = async () => {
    const r = await run(() => completeQuest(quest.id, code));
    if (r) {
      setResult(r);
      setCode('');
    }
  };

  return (
    <div className="space-y-3 p-4" data-testid="quest-sheet">
      <div className="flex flex-wrap items-center gap-2">
        <CategoryChip staticChip label={m.label} emoji={m.emoji} color={m.color} />
        <DifficultyStars value={quest.difficulty} />
        {quest.chain && (
          <Pill tone="coral">
            Step {quest.chain.order}/{quest.chain.total} · {quest.chain.title}
          </Pill>
        )}
      </div>
      <h2 className="cz-display text-2xl leading-tight">{quest.title}</h2>
      <div className="text-sm text-muted">
        {quest.org.emoji} {quest.org.name} · {quest.address} · {quest.durationMin} min
      </div>
      <BuildingView quest={quest} />
      <p className="text-sm">{quest.description}</p>
      <RewardBadge credits={quest.rewardCredits} xp={quest.rewardXp} />
      <PartyVibes quest={quest} />
      <TeamUpBanner quest={quest} />
      <PartyStrip quest={quest} />

      {(!st || st === 'ABANDONED') && (
        <Button
          block
          variant="leaf"
          loading={busy}
          disabled={quest.spotsLeft <= 0 || quest.status !== 'OPEN'}
          onClick={() => {
            // open the tab inside the click (popup blockers), send it to directions once the accept succeeds
            const w = window.open('', '_blank');
            void run(() => acceptQuest(quest.id), 'Quest accepted! Opening directions.').then((r) => {
              if (!w) return;
              if (r) w.location.href = navUrl(quest); else w.close();
            });
          }}
        >
          {quest.spotsLeft <= 0 ? 'Quest full' : 'Accept quest and get directions'}
        </Button>
      )}
      {(st === 'ACCEPTED' || st === 'CHECKED_IN') && (
        <a className="cz-btn cz-btn--sky cz-btn--block" href={navUrl(quest)} target="_blank" rel="noopener noreferrer">
          Navigate in Google Maps
        </a>
      )}
      {st === 'ACCEPTED' && (
        <div className="flex gap-2">
          <Button block loading={busy} onClick={doCheckIn}>
            Check in
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => run(() => abandonQuest(quest.id), 'Quest abandoned')}>
            Abandon
          </Button>
        </div>
      )}
      {st === 'CHECKED_IN' && (
        <div className="space-y-2">
          <label className="text-sm font-bold" htmlFor="verify-code">
            Enter the 4-digit code from the quest giver
          </label>
          <input
            id="verify-code"
            inputMode="numeric"
            maxLength={8}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="1234"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-center text-2xl tracking-[0.4em]"
          />
          <div className="flex gap-2">
            <Button block variant="leaf" loading={busy} disabled={!code.trim()} onClick={doComplete}>
              Complete quest
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => run(() => abandonQuest(quest.id), 'Quest abandoned')}>
              Abandon
            </Button>
          </div>
        </div>
      )}
      {st === 'COMPLETED' && <Pill tone="leaf">✅ You completed this quest</Pill>}
      {quest.verifyCode && (
        <div className="text-xs text-muted">
          Giver view · verify code <b>{quest.verifyCode}</b>
        </div>
      )}

      <Modal open={!!result} onClose={() => setResult(null)} title={result?.levelUp ? 'Level up!' : 'Quest complete!'} tone="leaf" confetti>
        {result && (
          <div className="space-y-3 text-center" data-testid="complete-modal">
            <div className="text-5xl">{result.me.avatarEmoji}</div>
            <RewardBadge credits={result.earned.credits} xp={result.earned.xp} chainBonus={result.earned.chainBonus} />
            <div className="text-sm text-muted">
              Level {result.me.level} {result.me.avatarClass} · {result.me.credits} credits
            </div>
            {result.newBadges.map((b) => (
              <Pill key={b.slug} tone="gold">
                {b.icon} {b.name}
              </Pill>
            ))}
            <Button block onClick={() => setResult(null)}>
              Nice!
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
