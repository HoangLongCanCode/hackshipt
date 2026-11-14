'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, useToast } from '@/components/ui';
import { CategoryChip } from '@/components/quest';
import { ApiError } from '@/lib/contracts';
import { login, updateProfile, useInterests } from '@/lib/client/api';

const DEFAULT_PICKS = ['gardening', 'food', 'community'];

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { data: interests } = useInterests();
  const [email, setEmail] = useState('demo@rpgbirmingham.app');
  const [name, setName] = useState('Alex the Wanderer');
  const [picks, setPicks] = useState<string[]>(DEFAULT_PICKS);
  const [artist, setArtist] = useState('');
  const [hobby, setHobby] = useState('');
  const [busy, setBusy] = useState(false);

  async function begin() {
    setBusy(true);
    try {
      const me = await login(email.trim(), name.trim() || undefined);
      // First visit (no interests yet): save the picks so matching works.
      if (me.interests.length === 0 && picks.length) await updateProfile({ interestSlugs: picks });
      // Only fill blanks, so logging back in never overwrites a saved artist/hobby.
      const taste = { ...(artist.trim() && !me.favoriteArtist ? { favoriteArtist: artist.trim() } : {}), ...(hobby.trim() && !me.hobby ? { hobby: hobby.trim() } : {}) };
      if (Object.keys(taste).length) await updateProfile(taste);
      router.replace('/');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not log in');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-5">
      <div className="text-sm font-extrabold text-accent">RPG Birmingham</div>
      <h1 className="cz-display text-4xl leading-[1.1]">Birmingham has things that need doing. Go do one.</h1>
      <p className="text-[15px] leading-relaxed text-muted">
        Local nonprofits post small volunteer jobs: an hour in a teaching garden, a shift sorting food. Pick one on the map, show up,
        and earn credits you can spend at local shops or give to a cause.
      </p>
      <ol className="space-y-1.5 text-sm">
        <li><b>1. Pick</b> a quest on the map.</li>
        <li><b>2. Go.</b> Accepting opens directions in Google Maps.</li>
        <li><b>3. Check in</b> with the host&apos;s 4-digit code and collect credits and XP.</li>
      </ol>
      <p className="text-xs text-muted">Quests from Birmingham Promise, Firehouse Ministries, Jones Valley Teaching Farm and Ed Farm. Demo app: the organizations are fictional listings and have not endorsed it.</p>
      <Card hero className="space-y-3">
        <label className="block text-sm font-bold">
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email"
            className="mt-1 w-full rounded-2xl border border-border bg-surface px-4 py-3" />
        </label>
        <label className="block text-sm font-bold">
          Adventurer name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40}
            className="mt-1 w-full rounded-2xl border border-border bg-surface px-4 py-3" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-bold">
            🎵 Fav artist
            <input value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={60} placeholder="Optional"
              className="mt-1 w-full rounded-2xl border border-border bg-surface px-3 py-2" />
          </label>
          <label className="block text-sm font-bold">
            🎯 Hobby
            <input value={hobby} onChange={(e) => setHobby(e.target.value)} maxLength={60} placeholder="Optional"
              className="mt-1 w-full rounded-2xl border border-border bg-surface px-3 py-2" />
          </label>
        </div>
        <div>
          <div className="mb-1 text-sm font-bold">What are you into?</div>
          <div className="flex flex-wrap gap-2">
            {(interests ?? []).map((i) => (
              <CategoryChip key={i.slug} label={i.label} emoji={i.emoji} color="#F07C5A" selected={picks.includes(i.slug)}
                onClick={() => setPicks((p) => (p.includes(i.slug) ? p.filter((x) => x !== i.slug) : [...p, i.slug]))} />
            ))}
          </div>
        </div>
        <Button block size="lg" loading={busy} disabled={!email.includes('@')} onClick={begin}>
          Begin your adventure
        </Button>
      </Card>
    </main>
  );
}
