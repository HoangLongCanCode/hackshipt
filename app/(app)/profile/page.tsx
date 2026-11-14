'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, Button, Card, EmptyState, Pill, ProgressBar, SkeletonCard, useToast } from '@/components/ui';
import { CLASS_META, DISTRICTS } from '@/lib/constants';
import { logout, updateProfile, useLedger, useMe } from '@/lib/client/api';

export default function ProfilePage() {
  const router = useRouter();
  const { data: me, error, mutate } = useMe();
  const { data: ledger } = useLedger();
  const toast = useToast();
  const [artist, setArtist] = useState('');
  const [hobby, setHobby] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (me) {
      setArtist(me.favoriteArtist ?? '');
      setHobby(me.hobby ?? '');
    }
  }, [me?.favoriteArtist, me?.hobby]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveTaste() {
    setSaving(true);
    try {
      await updateProfile({ favoriteArtist: artist.trim(), hobby: hobby.trim() });
      toast.success('Profile saved');
    } catch {
      toast.error('Could not save');
    } finally {
      setSaving(false);
    }
  }

  if (error) return <div className="pt-24"><EmptyState emoji="😵" title="Couldn't load profile" action={<Button onClick={() => mutate()}>Try again</Button>} /></div>;
  if (!me) return <div className="px-4 pb-28 pt-24"><SkeletonCard /></div>;

  return (
    <div className="space-y-4 px-4 pb-28 pt-24">
      <Card hero stitch className="flex items-center gap-4">
        <Avatar emoji={me.avatarEmoji} size={64} />
        <div className="min-w-0 flex-1">
          <div className="cz-display text-2xl leading-tight">{me.displayName}</div>
          <div className="text-sm text-muted" data-testid="class-line">
            Level {me.level} {CLASS_META[me.avatarClass].label}
          </div>
          <ProgressBar className="mt-2" value={me.xpForNext ? (me.xpIntoLevel / me.xpForNext) * 100 : 0} label="XP to next level" />
          <div className="mt-1 text-xs text-muted">{me.xpIntoLevel} / {me.xpForNext} XP · {me.xp} total</div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Card><div className="cz-display text-xl">{me.stats.questsCompleted}</div><div className="text-xs text-muted">quests</div></Card>
        <Card><div className="cz-display text-xl">{me.stats.creditsEarned}</div><div className="text-xs text-muted">earned</div></Card>
        <Card><div className="cz-display text-xl">{me.stats.creditsDonated}</div><div className="text-xs text-muted">donated</div></Card>
      </div>

      <section>
        <h2 className="cz-display mb-2 text-xl">Badges</h2>
        <div className="flex flex-wrap gap-2" data-testid="badges">
          {me.badges.length === 0 && <span className="text-sm text-muted">Complete a quest to earn your first badge.</span>}
          {me.badges.map((b) => <Pill key={b.slug} tone="gold" title={b.description}>{b.icon} {b.name}</Pill>)}
        </div>
      </section>

      <section>
        <h2 className="cz-display mb-2 text-xl">About you</h2>
        <Card className="space-y-2">
          <label className="block text-sm font-bold">
            🎵 Favorite music artist
            <input value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={60} placeholder="e.g. Alabama Shakes" data-testid="artist-input"
              className="mt-1 w-full rounded-2xl border border-border bg-surface px-3 py-2" />
          </label>
          <label className="block text-sm font-bold">
            🎯 Hobby
            <input value={hobby} onChange={(e) => setHobby(e.target.value)} maxLength={60} placeholder="e.g. Hiking" data-testid="hobby-input"
              className="mt-1 w-full rounded-2xl border border-border bg-surface px-3 py-2" />
          </label>
          <div className="text-xs text-muted">Teammates on the same quest see when you share an artist or hobby.</div>
          <Button block size="sm" loading={saving} disabled={artist.trim() === (me.favoriteArtist ?? '') && hobby.trim() === (me.hobby ?? '')} onClick={saveTaste}>Save</Button>
        </Card>
      </section>

      <section>
        <h2 className="cz-display mb-2 text-xl">Interests</h2>
        <div className="flex flex-wrap gap-2">{me.interests.map((i) => <Pill key={i.slug}>{i.emoji} {i.label}</Pill>)}</div>
      </section>

      <section>
        <h2 className="cz-display mb-2 text-xl">Districts</h2>
        <div className="flex flex-wrap gap-2">
          {DISTRICTS.map((d) => {
            const seen = me.revealedDistricts.includes(d.name);
            return <Pill key={d.name} tone={seen ? 'leaf' : 'outline'}>{seen ? d.name : '???'}</Pill>;
          })}
        </div>
      </section>

      <section>
        <h2 className="cz-display mb-2 text-xl">Recent activity</h2>
        <div className="space-y-1 text-sm">
          {ledger?.length === 0 && <span className="text-muted">Nothing yet.</span>}
          {ledger?.slice(0, 8).map((l) => (
            <div key={l.id} className="flex justify-between"><span>{l.note}</span><b className={l.delta > 0 ? 'text-xp' : 'text-danger'}>{l.delta > 0 ? '+' : ''}{l.delta}</b></div>
          ))}
        </div>
      </section>

      <div className="flex gap-2">
        <Link href="/donate" className="flex-1"><Button block variant="gold">Donate</Button></Link>
        <Link href="/giver" className="flex-1"><Button block variant="secondary">Quest giver</Button></Link>
        <Button variant="ghost" onClick={async () => { await logout(); router.replace('/login'); }}>Log out</Button>
      </div>
    </div>
  );
}
