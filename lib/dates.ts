// Quest schedule helpers. Dates are floating local Birmingham dates ("YYYY-MM-DD") + "HH:MM".
const TZ = 'America/Chicago';

export const todayStr = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

const parts = (ymd: string) => ymd.split('-').map(Number) as [number, number, number];
export const toDate = (ymd: string) => { const [y, m, d] = parts(ymd); return new Date(y, m - 1, d); };
export const addDays = (ymd: string, n: number) => {
  const [y, m, d] = parts(ymd);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
};

export function fmtTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ap}`;
}

export function endTime(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const t = h * 60 + m + minutes;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

/** "Today", "Tomorrow" or "Tue, Nov 18". */
export function fmtDay(ymd: string, today = todayStr()): string {
  if (ymd === today) return 'Today';
  if (ymd === addDays(today, 1)) return 'Tomorrow';
  return toDate(ymd).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export const fmtWhen = (q: { date: string; time: string; durationMin: number }) =>
  `${fmtDay(q.date)} · ${fmtTime(q.time)}–${fmtTime(endTime(q.time, q.durationMin))}`;

export type DateFilter = { kind: 'any' } | { kind: 'today' } | { kind: 'tomorrow' } | { kind: 'week' } | { kind: 'date'; date: string };

export function matchesDate(q: { date: string }, f: DateFilter, today = todayStr()): boolean {
  switch (f.kind) {
    case 'any': return true;
    case 'today': return q.date === today;
    case 'tomorrow': return q.date === addDays(today, 1);
    case 'week': return q.date >= today && q.date <= addDays(today, 6);
    case 'date': return q.date === f.date;
  }
}

/** "Add to Google Calendar" template link (the in-app calendar lives on /activities). */
export function googleCalendarUrl(q: { title: string; date: string; time: string; durationMin: number; address: string; description: string }): string {
  const stamp = (d: string, t: string) => `${d.replace(/-/g, '')}T${t.replace(':', '')}00`;
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${q.title} (RPG Birmingham)`,
    dates: `${stamp(q.date, q.time)}/${stamp(q.date, endTime(q.time, q.durationMin))}`,
    ctz: TZ,
    location: q.address,
    details: q.description,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
