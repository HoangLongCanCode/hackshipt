/* Smoke test against a RUNNING server: `npm run dev` (or `npm start`), then `npm run smoke`.
 * Uses a fresh user each run, so it is re-runnable without db:reset. Needs DEMO_MODE=true (no GPS / daily cap).
 * BASE_URL overrides http://localhost:3000. */
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

type Env<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };
let failures = 0;

function check(cond: unknown, label: string) {
  if (cond) console.log(`  ok   ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`);
  }
}

class Client {
  cookie = '';
  async call<T = any>(path: string, method = 'GET', body?: unknown): Promise<{ status: number; env: Env<T> }> {
    const res = await fetch(BASE + path, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(this.cookie ? { cookie: this.cookie } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    });
    const set = res.headers.getSetCookie?.() ?? [];
    if (set.length) this.cookie = set.map((c) => c.split(';')[0]).join('; ');
    return { status: res.status, env: (await res.json()) as Env<T> };
  }
}

async function main() {
  console.log(`Smoke test -> ${BASE}`);
  const u = new Client();
  const stamp = Date.now();

  console.log('auth');
  const anon = await u.call('/api/me');
  check(anon.status === 401 && !anon.env.ok && anon.env.error.code === 'UNAUTHENTICATED', 'GET /api/me without session -> 401 UNAUTHENTICATED');
  const login = await u.call('/api/auth/login', 'POST', { email: `smoke+${stamp}@rpgbirmingham.app`, displayName: 'Smoke Tester' });
  check(login.status === 200 && login.env.ok, 'login ok (envelope)');
  const startCredits = login.env.ok ? login.env.data.credits : -1;
  const ints = await u.call('/api/me', 'PATCH', { interestSlugs: ['animals', 'gardening', 'parks'] });
  check(ints.env.ok && ints.env.data.interests.length === 3, 'PATCH /api/me saves interests');

  const taste = await u.call<any>('/api/me', 'PATCH', { favoriteArtist: 'Alabama Shakes', hobby: 'Hiking' });
  check(taste.env.ok && taste.env.data.favoriteArtist === 'Alabama Shakes' && taste.env.data.hobby === 'Hiking', 'PATCH /api/me saves favoriteArtist + hobby');

  console.log('quest flow');
  const list = await u.call<any[]>('/api/quests');
  const dog = list.env.ok ? list.env.data.find((q) => q.title === 'Dog Day at the Shelter') : undefined;
  check(!!dog, 'seeded quest "Dog Day at the Shelter" exists');
  if (!dog) throw new Error('Run `npm run db:reset` first.');
  check(dog.verifyCode === undefined, 'list never leaks verifyCode');
  const id = dog.id as string;
  const detail = await u.call<any>(`/api/quests/${id}`);
  const maya = detail.env.ok ? detail.env.data.party.find((p: any) => p.displayName === 'Maya') : undefined;
  check(maya?.favoriteArtist === 'Alabama Shakes' && maya?.hobby === 'Hiking', 'party members expose favoriteArtist + hobby (shared-taste vibes)');
  const codes = await u.call<Record<string, string>>('/api/demo/codes');
  check(codes.env.ok && codes.env.data[id] === '1111', 'DEMO_MODE: /api/demo/codes returns the check-in code');
  const early = await u.call(`/api/quests/${id}/complete`, 'POST', { code: '1111' });
  check(early.status === 409, 'complete before accept/check-in -> 409');
  const acc = await u.call(`/api/quests/${id}/accept`, 'POST');
  check(acc.env.ok && acc.env.data.myStatus === 'ACCEPTED', 'accept -> myStatus ACCEPTED');
  const dup = await u.call(`/api/quests/${id}/accept`, 'POST');
  check(dup.status === 409, 'double accept -> 409 CONFLICT');
  const ci = await u.call(`/api/quests/${id}/checkin`, 'POST', { lat: dog.lat, lng: dog.lng });
  check(ci.env.ok && ci.env.data.myStatus === 'CHECKED_IN', 'checkin -> CHECKED_IN');
  const bad = await u.call(`/api/quests/${id}/complete`, 'POST', { code: '0000' });
  check(bad.status === 422 && !bad.env.ok && bad.env.error.code === 'BAD_CODE', 'wrong code -> 422 BAD_CODE');
  const done = await u.call(`/api/quests/${id}/complete`, 'POST', { code: '1111' });
  check(done.env.ok && done.env.data.earned.credits === dog.rewardCredits, 'complete -> earned credits match reward');
  check(done.env.ok && done.env.data.me.credits === startCredits + dog.rewardCredits, 'balance = start + reward');
  check(done.env.ok && done.env.data.newBadges.some((b: any) => b.slug === 'first-steps'), 'first-steps badge awarded');
  check(done.env.ok && done.env.data.me.avatarClass === 'keeper', 'class Wanderer -> Keeper');
  check(done.env.ok && done.env.data.me.revealedDistricts.includes('Five Points South'), 'district revealed');
  let balance = done.env.ok ? done.env.data.me.credits : 0;

  console.log('store + donate');
  const store = await u.call<any>('/api/store');
  const offers = store.env.ok ? store.env.data.sponsors.flatMap((s: any) => s.offers) : [];
  const cheap = offers.filter((o: any) => o.costCredits <= balance).sort((a: any, b: any) => a.costCredits - b.costCredits)[0];
  check(!!cheap, 'an affordable offer exists');
  if (cheap) {
    const r = await u.call<any>('/api/store/redeem', 'POST', { offerId: cheap.id });
    check(r.env.ok && /^RPGB-[A-Z0-9]{5}$/.test(r.env.data.code), 'redeem -> RPGB code');
    check(r.env.ok && r.env.data.balance === balance - cheap.costCredits, 'redeem balance correct');
    balance -= cheap.costCredits;
  }
  const over = await u.call(`/api/donate`, 'POST', { causeId: 'x', amount: 999999 });
  check(over.status === 404 || over.status === 402, 'bad donate rejected');
  const causes = await u.call<any[]>('/api/causes');
  const cause = causes.env.ok ? causes.env.data[0] : undefined;
  const give = Math.min(10, balance);
  if (cause && give > 0) {
    const d = await u.call<any>('/api/donate', 'POST', { causeId: cause.id, amount: give });
    check(d.env.ok && d.env.data.balance === balance - give, 'donate balance correct');
    check(d.env.ok && d.env.data.cause.raisedCredits === cause.raisedCredits + give, 'cause raised increases');
    balance -= give;
  }
  const overspend = await u.call('/api/donate', 'POST', { causeId: cause?.id, amount: balance + 1000 });
  check(overspend.status === 402, 'overspend -> 402 INSUFFICIENT_CREDITS');
  const me = await u.call<any>('/api/me');
  check(me.env.ok && me.env.data.credits === balance, '/api/me balance matches running total');
  check(me.env.ok && me.env.data.badges.some((b: any) => b.slug === 'patron'), 'patron badge after donation');

  console.log('social');
  const matches = await u.call<any[]>('/api/matches');
  check(matches.env.ok && matches.env.data.length >= 3, `/api/matches returns >=3 (got ${matches.env.ok ? matches.env.data.length : 'err'})`);
  check(matches.env.ok && matches.env.data.every((m) => m.reason && m.userId !== (me.env.ok ? me.env.data.id : '')), 'matches have reasons, exclude self');
  const lb = await u.call<any[]>('/api/leaderboard?scope=neighborhood');
  check(lb.env.ok && lb.env.data.length > 0 && lb.env.data[0].rank === 1, 'leaderboard ranked');

  console.log('chains');
  const chains = await u.call<any[]>('/api/chains');
  const chain = chains.env.ok ? chains.env.data[0] : undefined;
  check(!!chain && chain.steps.length === 3 && chain.steps.every((s: any) => !s.done), 'chain has 3 undone steps');
  if (chain) {
    const step1 = chain.steps[0];
    const codes = ['1414'];
    await u.call(`/api/quests/${step1.questId}/accept`, 'POST');
    await u.call(`/api/quests/${step1.questId}/checkin`, 'POST', { lat: 33.52, lng: -86.77 });
    const c1 = await u.call(`/api/quests/${step1.questId}/complete`, 'POST', { code: codes[0] });
    check(c1.env.ok, 'chain step 1 completes');
    const after = await u.call<any[]>('/api/chains');
    check(after.env.ok && after.env.data[0].steps[0].done && !after.env.data[0].steps[1].done, 'chain progress advances (step 1 done)');
  }

  console.log('giver');
  check((await u.call('/api/giver/quests')).status === 403, 'non-giver GET /api/giver/quests -> 403');
  check((await u.call('/api/giver/quests', 'POST', {})).status === 403, 'non-giver POST /api/giver/quests -> 403');
  const g = new Client();
  await g.call('/api/auth/login', 'POST', { email: 'giver@rpgbirmingham.app', displayName: 'Gina the Giver' });
  const input = { title: `Smoke Quest ${stamp}`, description: 'Created by smoke test', category: 'community', lat: 33.5186, lng: -86.8104, neighborhood: 'Downtown', address: 'Demo St', difficulty: 2, durationMin: 60, capacity: 3, interestSlugs: [] };
  const bogus = await g.call('/api/giver/quests', 'POST', { ...input, title: 'x' });
  check(bogus.status === 400, 'invalid giver input -> 400');
  const mk = await g.call<any>('/api/giver/quests', 'POST', input);
  check(mk.env.ok && /^\d{4}$/.test(mk.env.data.verifyCode), 'giver creates quest, gets 4-digit code');
  check(mk.env.ok && mk.env.data.rewardCredits > 0, 'reward computed');
  if (mk.env.ok) {
    const newId: string = mk.env.data.id;
    const newCode: string = mk.env.data.verifyCode;
    const seen = await u.call<any>(`/api/quests/${newId}`);
    check(seen.env.ok && seen.env.data.verifyCode === undefined, 'adventurer detail view does NOT leak giver code');
    const all = await u.call<any[]>('/api/quests');
    check(all.env.ok && all.env.data.some((q) => q.id === newId), 'new quest appears in /api/quests');
    const mine = await g.call<any[]>('/api/giver/quests');
    check(mine.env.ok && mine.env.data.find((q) => q.id === newId)?.verifyCode === newCode, 'giver list includes code');
  }

  console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll smoke checks passed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
