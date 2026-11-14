'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Navigation } from 'lucide-react';
import { Button, Card, EmptyState, Pill, SkeletonCard } from '@/components/ui';
import { useQuests } from '@/lib/client/api';
import { addDays, endTime, fmtDay, fmtTime, googleCalendarUrl, toDate, todayStr } from '@/lib/dates';
import type { QuestDTO } from '@/lib/contracts';

const MY = ['ACCEPTED', 'CHECKED_IN', 'COMPLETED'];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const pad = (n: number) => String(n).padStart(2, '0');

/** My Activities: a month calendar of everything you've signed up for, plus the list for the picked day. */
export default function ActivitiesPage() {
  const today = todayStr();
  const { data: quests, error, mutate } = useQuests();
  const [month, setMonth] = useState(today.slice(0, 7)); // YYYY-MM
  const [picked, setPicked] = useState<string | null>(today);

  const mine = useMemo(
    () => (quests ?? []).filter((q) => q.myStatus && MY.includes(q.myStatus)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [quests],
  );
  const byDay = useMemo(() => {
    const m = new Map<string, QuestDTO[]>();
    for (const q of mine) m.set(q.date, [...(m.get(q.date) ?? []), q]);
    return m;
  }, [mine]);

  const [y, mo] = month.split('-').map(Number);
  const first = new Date(y, mo - 1, 1);
  const daysIn = new Date(y, mo, 0).getDate();
  const cells: (string | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysIn }, (_, i) => `${y}-${pad(mo)}-${pad(i + 1)}`)];
  const shift = (n: number) => { const d = new Date(y, mo - 1 + n, 1); setMonth(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`); };

  const dayList = picked ? byDay.get(picked) ?? [] : [];
  const upcoming = mine.filter((q) => q.date >= today && q.myStatus !== 'COMPLETED');

  return (
    <div className="space-y-4 px-4 pb-28 pt-24" data-testid="activities">
      <h1 className="cz-display text-2xl">My Activities</h1>

      {error ? (
        <EmptyState emoji="😵" title="Couldn't load your activities" action={<Button onClick={() => mutate()}>Try again</Button>} />
      ) : !quests ? (
        <SkeletonCard />
      ) : (
        <>
          <Card className="space-y-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" aria-label="Previous month" onClick={() => shift(-1)} icon={<ChevronLeft size={18} />} />
              <div className="cz-display text-lg">{first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
              <Button variant="ghost" size="sm" aria-label="Next month" onClick={() => shift(1)} icon={<ChevronRight size={18} />} />
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-muted">
              {DOW.map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1" data-testid="calendar-grid">
              {cells.map((d, i) => {
                if (!d) return <div key={i} />;
                const n = byDay.get(d)?.length ?? 0;
                const sel = d === picked;
                return (
                  <button
                    key={d}
                    onClick={() => setPicked(sel ? null : d)}
                    aria-label={`${fmtDay(d, today)}${n ? `, ${n} ${n === 1 ? 'activity' : 'activities'}` : ''}`}
                    aria-pressed={sel}
                    data-testid={n ? 'cal-day-busy' : 'cal-day'}
                    className={`relative grid h-11 place-items-center rounded-xl text-sm font-bold transition-colors ${sel ? 'bg-[var(--cz-coral)] text-white' : d === today ? 'bg-[var(--cz-paper-2)] ring-2 ring-[var(--cz-mustard)]' : 'hover:bg-[var(--cz-paper-2)]'}`}
                  >
                    {Number(d.slice(8))}
                    {n > 0 && (
                      <span className="absolute bottom-1 flex gap-0.5">
                        {Array.from({ length: Math.min(n, 3) }).map((_, k) => <span key={k} className={`h-1.5 w-1.5 rounded-full ${sel ? 'bg-white' : 'bg-[var(--cz-coral)]'}`} />)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {picked && (
            <section className="space-y-3">
              <h2 className="cz-eyebrow">{fmtDay(picked, today)}</h2>
              {dayList.length === 0 ? (
                <p className="text-sm text-muted">Nothing planned. Sign up for a quest from the map and it lands here.</p>
              ) : (
                dayList.map((q) => <ActivityCard key={q.id} q={q} />)
              )}
            </section>
          )}

          <section className="space-y-3">
            <h2 className="cz-eyebrow">Coming up</h2>
            {upcoming.length === 0 ? (
              <EmptyState emoji="🗓️" title="No upcoming activities" message="Sign up for a quest and it shows up on the calendar." action={<Link className="cz-btn" href="/">Browse the map</Link>} />
            ) : (
              upcoming.map((q) => <ActivityCard key={q.id} q={q} showDay />)
            )}
          </section>
        </>
      )}
    </div>
  );
}

function ActivityCard({ q, showDay }: { q: QuestDTO; showDay?: boolean }) {
  const today = todayStr();
  const status = q.myStatus === 'COMPLETED' ? <Pill tone="leaf">Done</Pill> : q.myStatus === 'CHECKED_IN' ? <Pill tone="sky">Checked in</Pill> : q.date === today ? <Pill tone="coral">Today</Pill> : <Pill tone="gold">Scheduled</Pill>;
  return (
    <Card className="space-y-2" data-testid="activity-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-bold text-muted">
            {showDay ? `${fmtDay(q.date, today)} · ` : ''}{fmtTime(q.time)}–{fmtTime(endTime(q.time, q.durationMin))}
          </div>
          <Link href={`/quest/${q.id}`} className="font-bold leading-tight underline-offset-2 hover:underline">{q.title}</Link>
          <div className="text-xs text-muted">{q.org.emoji} {q.org.name} · {q.neighborhood}</div>
        </div>
        {status}
      </div>
      {q.myStatus !== 'COMPLETED' && (
        <div className="flex flex-wrap gap-2">
          <a className="cz-btn cz-btn--sky cz-btn--sm" href={`https://www.google.com/maps/dir/?api=1&destination=${q.lat},${q.lng}`} target="_blank" rel="noopener noreferrer">
            <Navigation size={14} aria-hidden /> Directions
          </a>
          <a className="cz-btn cz-btn--secondary cz-btn--sm" href={googleCalendarUrl(q)} target="_blank" rel="noopener noreferrer">Add to Google Calendar</a>
          <Link className="cz-btn cz-btn--ghost cz-btn--sm" href={`/quest/${q.id}`}>{q.date === today ? 'Check in' : 'Details'}</Link>
        </div>
      )}
    </Card>
  );
}
