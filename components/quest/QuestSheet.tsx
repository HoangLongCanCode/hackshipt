'use client';

import { useState } from 'react';
import { Button, Modal, Pill, useToast } from '@/components/ui';
import { CATEGORY_META } from '@/lib/constants';
import { ApiError } from '@/lib/contracts';
import type { CompleteResultDTO, QuestDetailDTO } from '@/lib/contracts';
import { abandonQuest, acceptQuest, checkIn, completeQuest, useMe } from '@/lib/client/api';
import XpGain from './XpGain';
import { CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { fmtDay, fmtTime, fmtWhen, googleCalendarUrl, todayStr } from '@/lib/dates';
import BuildingView from './BuildingView';
import PartyVibes from '@/components/social/PartyVibes';
import PartyStrip from '@/components/social/PartyStrip';
import TeamUpBanner from '@/components/social/TeamUpBanner';
import CategoryChip from './CategoryChip';
import DifficultyStars from './DifficultyStars';
import RewardBadge from './RewardBadge';

/** Quest detail + the accept -> check in -> complete flow. Renders inside the bottom sheet or /quest/[id]. */
const navUrl = (q: { lat: number; lng: number }) => `https://www.google.com/maps/dir/?api=1&destination=${q.lat},${q.lng}`;

export default function QuestSheet({ quest }: { quest: QuestDetailDTO }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<CompleteResultDTO | null>(null);
  const { data: meNow } = useMe();
  const [before, setBefore] = useState<{ level: number; into: number; need: number } | null>(null);
  const m = CATEGORY_META[quest.category];
  const st = quest.myStatus;
  const isToday = quest.date === todayStr();

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
    if (meNow) setBefore({ level: meNow.level, into: meNow.xpIntoLevel, need: meNow.xpForNext });
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
      <div className="flex items-center gap-2 rounded-2xl bg-[var(--cz-paper-2)] px-3 py-2 text-sm font-bold" data-testid="quest-when">
        <CalendarDays size={18} aria-hidden /> {fmtWhen(quest)}
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
          onClick={() => run(() => acceptQuest(quest.id), `You're signed up for ${fmtDay(quest.date)} at ${fmtTime(quest.time)}. Added to My Activities.`)}
        >
          {quest.spotsLeft <= 0 ? 'Quest full' : 'Sign up'}
        </Button>
      )}
      {(st === 'ACCEPTED' || st === 'CHECKED_IN') && (
        <div className="grid grid-cols-2 gap-2">
          <a className="cz-btn cz-btn--sky cz-btn--sm" href={navUrl(quest)} target="_blank" rel="noopener noreferrer">
            Directions
          </a>
          <a className="cz-btn cz-btn--secondary cz-btn--sm" href={googleCalendarUrl(quest)} target="_blank" rel="noopener noreferrer">
            Add to Google Calendar
          </a>
          <Link className="cz-btn cz-btn--ghost cz-btn--sm col-span-2" href="/activities">
            See it in My Activities
          </Link>
        </div>
      )}
      {st === 'ACCEPTED' && (
        <div className="flex gap-2">
          {isToday ? (
            <Button block loading={busy} onClick={doCheckIn}>
              Check in
            </Button>
          ) : (
            <Button block disabled data-testid="scheduled-btn" aria-label={`Scheduled for ${fmtDay(quest.date)}. Check-in opens that day.`}>
              Scheduled · {fmtDay(quest.date)}
            </Button>
          )}
          <Button variant="ghost" disabled={busy} onClick={() => run(() => abandonQuest(quest.id), 'Sign-up cancelled')}>
            Cancel
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
            <Button variant="ghost" disabled={busy} onClick={() => run(() => abandonQuest(quest.id), 'Sign-up cancelled')}>
              Cancel
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
            {before && (
              <XpGain
                fromLevel={before.level} fromInto={before.into} fromNeed={before.need}
                toLevel={result.me.level} toInto={result.me.xpIntoLevel} toNeed={result.me.xpForNext}
                gained={result.earned.xp}
              />
            )}
            <div className="text-sm text-muted">
              {result.me.credits} credits now
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
