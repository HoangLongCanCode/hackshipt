'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, EmptyState, SkeletonCard, useToast } from '@/components/ui';
import { CATEGORIES, ApiError, type Category, type QuestDetailDTO } from '@/lib/contracts';
import { CATEGORY_META, DISTRICTS } from '@/lib/constants';
import { giverCreateQuest, useGiverQuests } from '@/lib/client/api';

const field = 'mt-1 w-full rounded-2xl border border-border bg-surface px-3 py-2';

export default function GiverPage() {
  const router = useRouter();
  const toast = useToast();
  const { data: mine, error, mutate } = useGiverQuests();
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<QuestDetailDTO | null>(null);
  const [f, setF] = useState({ title: '', description: '', category: 'community' as Category, district: DISTRICTS[0].name, address: '', difficulty: 2, durationMin: 60, capacity: 4 });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  async function submit() {
    const d = DISTRICTS.find((x) => x.name === f.district) ?? DISTRICTS[0];
    // Nudge pins so several new quests in one district don't stack exactly.
    const jitter = () => (Math.random() - 0.5) * 0.004;
    setBusy(true);
    try {
      const q = await giverCreateQuest({
        title: f.title, description: f.description, category: f.category,
        lat: d.center.lat + jitter(), lng: d.center.lng + jitter(),
        neighborhood: d.name, address: f.address || `${d.name} (demo)`,
        difficulty: f.difficulty as 1 | 2 | 3 | 4 | 5, durationMin: f.durationMin, capacity: f.capacity, interestSlugs: [],
      });
      setCreated(q);
      toast.success('Quest posted!'); // act() already revalidated every SWR key, so the map refreshes without a reload
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not post quest');
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    const forbidden = (error as ApiError).code === 'FORBIDDEN';
    return (
      <div className="pt-24">
        <EmptyState emoji="🔒" title={forbidden ? 'Quest givers only' : "Couldn't load"}
          message={forbidden ? 'Log in as giver@rpgbirmingham.app to post quests for an organization.' : undefined}
          action={<Button onClick={() => mutate()}>Try again</Button>} />
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pb-28 pt-24">
      <h1 className="cz-display text-2xl">Quest giver</h1>

      {created && (
        <Card hero stitch className="space-y-2 text-center" data-testid="giver-success">
          <div className="text-sm text-muted">Quest posted: {created.title}</div>
          <div className="text-xs text-muted">Verify code (share it with volunteers on site)</div>
          <div className="cz-display text-7xl tracking-widest" data-testid="giver-code">{created.verifyCode}</div>
          <Button block onClick={() => router.push('/')}>View on map</Button>
        </Card>
      )}

      <Card className="space-y-2">
        <label className="block text-sm font-bold">Title<input className={field} value={f.title} onChange={(e) => set('title', e.target.value)} maxLength={80} /></label>
        <label className="block text-sm font-bold">Description<textarea className={field} rows={3} value={f.description} onChange={(e) => set('description', e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-bold">Category
            <select className={field} value={f.category} onChange={(e) => set('category', e.target.value as Category)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_META[c].emoji} {CATEGORY_META[c].label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold">District
            <select className={field} value={f.district} onChange={(e) => set('district', e.target.value)}>
              {DISTRICTS.map((d) => <option key={d.name}>{d.name}</option>)}
            </select>
          </label>
        </div>
        <label className="block text-sm font-bold">Address<input className={field} value={f.address} onChange={(e) => set('address', e.target.value)} placeholder="Optional" /></label>
        <div className="grid grid-cols-3 gap-2">
          <label className="block text-sm font-bold">Difficulty<input type="number" min={1} max={5} className={field} value={f.difficulty} onChange={(e) => set('difficulty', Number(e.target.value))} /></label>
          <label className="block text-sm font-bold">Minutes<input type="number" min={10} max={600} className={field} value={f.durationMin} onChange={(e) => set('durationMin', Number(e.target.value))} /></label>
          <label className="block text-sm font-bold">Spots<input type="number" min={1} max={50} className={field} value={f.capacity} onChange={(e) => set('capacity', Number(e.target.value))} /></label>
        </div>
        <Button block loading={busy} disabled={f.title.trim().length < 3 || f.description.trim().length < 3} onClick={submit}>Post quest</Button>
      </Card>

      <section>
        <h2 className="cz-display mb-2 text-xl">My org&apos;s quests</h2>
        {!mine ? <SkeletonCard /> : (
          <div className="space-y-2" data-testid="giver-list">
            {mine.map((q) => (
              <Card key={q.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0 text-sm"><div className="font-bold">{q.title}</div><div className="text-xs text-muted">{q.neighborhood}</div></div>
                <span className="cz-display rounded-xl bg-surface-2 px-3 py-1 text-xl tracking-widest">{q.verifyCode}</span>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
