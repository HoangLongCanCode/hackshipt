'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, useToast } from '@/components/ui';
import { CategoryChip } from '@/components/quest';
import { ApiError } from '@/lib/contracts';
import { login, updateProfile, useInterests } from '@/lib/client/api';

const DEFAULT_PICKS = ['animals', 'gardening', 'parks'];

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { data: interests } = useInterests();
  const [email, setEmail] = useState('demo@rpgbirmingham.app');
  const [name, setName] = useState('Alex the Wanderer');
  const [picks, setPicks] = useState<string[]>(DEFAULT_PICKS);
  const [busy, setBusy] = useState(false);

  async function begin() {
    setBusy(true);
    try {
      const me = await login(email.trim(), name.trim() || undefined);
      // First visit (no interests yet): save the picks so matching works.
      if (me.interests.length === 0 && picks.length) await updateProfile({ interestSlugs: picks });
      router.replace('/');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not log in');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-4">
      <h1 className="cz-display text-center text-4xl">RPG Birmingham</h1>
      <p className="text-center text-sm text-muted">Side quests for the Magic City</p>
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
