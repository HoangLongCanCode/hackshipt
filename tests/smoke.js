// Smoke test: the whole demo path against the API.
//   npm run smoke                                  -> calls lib/game.js directly (memory backend unless SUPABASE_* env is set)
//   SMOKE_BASE_URL=http://localhost:8001 npm run smoke   -> same checks over HTTP against a running server / preview URL
// The giver "post a quest" check leaves a quest behind, so against a real database it only runs with SMOKE_GIVER=1.
const assert = require("assert");

const BASE = (process.env.SMOKE_BASE_URL || "").replace(/\/$/, "");
let direct;
if (!BASE) direct = require("../lib/game").route;

async function call(method, path, body, token) {
  if (direct) return direct(method, path, body, token);
  const res = await fetch(`${BASE}/api/${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: method === "POST" ? JSON.stringify(body || {}) : undefined,
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error.message);
  return json.data;
}

// Run a full quest: accept -> check in -> complete with the host code.
async function doQuest(id, code, token) {
  await call("POST", `quests/${id}/accept`, {}, token);
  await call("POST", `quests/${id}/checkin`, {}, token);
  return call("POST", `quests/${id}/complete`, { code }, token);
}

(async () => {
  const email = `smoke${Date.now()}@example.com`;
  const { token } = await call("POST", "login", { email, name: "Smoke", interests: ["food", "tech"] });
  let s = await call("GET", "bootstrap", null, token);
  console.log("backend:", s.backend, "| quests:", s.quests.length, "| orgs:", s.orgs.length, "| mode:", BASE || "direct");
  assert.equal(s.orgs.length, 4); assert(s.quests.length >= 19);
  assert.equal(s.me.credits, 40); assert.equal(s.me.level, 1);

  // --- core loop: accept -> check in -> complete (+ guard rails) ---
  const q = s.quests.find((x) => x.id === "fh-meal");
  await call("POST", `quests/${q.id}/accept`, {}, token);
  await assert.rejects(() => call("POST", `quests/jv-seeds/accept`, {}, token), /current quest/);
  await assert.rejects(() => call("POST", `quests/${q.id}/complete`, { code: "2121" }, token), /Check in/);
  await call("POST", `quests/${q.id}/checkin`, {}, token);
  await assert.rejects(() => call("POST", `quests/${q.id}/complete`, { code: "0000" }, token), /code/);
  const r = await call("POST", `quests/${q.id}/complete`, { code: "2121" }, token);
  console.log("complete:", JSON.stringify(r));
  assert(r.earned.credits > 0 && r.earned.chainBonus === 0);
  assert(r.newBadges.some((b) => b.slug === "first-steps") && r.newBadges.some((b) => b.slug === "team-player"));
  s = await call("GET", "bootstrap", null, token);
  assert.equal(s.me.credits, 40 + r.earned.credits); assert.equal(s.me.xp, r.earned.xp); assert.equal(s.me.klass, "keeper");
  assert.equal(s.quests.find((x) => x.id === q.id).myStatus, "COMPLETED");
  await assert.rejects(() => call("POST", `quests/${q.id}/accept`, {}, token), /already completed/);

  // --- store, donate, leaderboard ---
  const red = await call("POST", "redeem", { offerId: "of-coffee" }, token);
  assert(/^RPGB-[A-Z0-9]{5}$/.test(red.code));
  await assert.rejects(() => call("POST", "redeem", { offerId: "of-climb" }, token), /Not enough/);
  await call("POST", "donate", { causeId: "c-meals", amount: 10 }, token);
  await assert.rejects(() => call("POST", "donate", { causeId: "c-meals", amount: 99999 }, token), /Not enough/);
  s = await call("GET", "bootstrap", null, token);
  assert.equal(s.me.credits, 40 + r.earned.credits - 20 - 10);
  assert(s.me.badges.some((b) => b.slug === "patron"));
  const meals = s.causes.find((c) => c.id === "c-meals");
  assert(meals.raised >= 410, "donation shows on the cause");
  assert(s.leaderboard.length >= 12 && s.leaderboard[0].xp >= s.leaderboard[1].xp);

  // --- taste matching ---
  await call("POST", "profile", { favoriteArtist: "Alabama Shakes", hobby: "Hiking" }, token);
  s = await call("GET", "bootstrap", null, token);
  assert.equal(s.me.favoriteArtist, "Alabama Shakes", "favorite artist saved (has `npm run db:schema` been applied?)");
  assert.equal(s.me.hobby, "Hiking");
  const ppl = await call("GET", "people", null, token);
  assert(ppl.length > 0);
  const maya = ppl.find((p) => p.name === "Maya R.");
  assert(maya && /Alabama Shakes/.test(maya.reason) && /hiking/.test(maya.reason), "Maya shares artist + hobby");
  console.log("people top:", ppl[0].name, "-", ppl[0].reason);
  await assert.rejects(() => call("POST", "redeem", { offerId: "of-coffee" }, null), /sign in/);

  // --- campaign: 3 steps, bonus + badge on the last ---
  assert.equal(s.chains.length, 1); assert(s.chains[0].steps.every((x) => !x.done));
  assert.deepEqual(s.quests.find((x) => x.id === "jv-c2").chain, { id: "ch-garden", title: "Revive the Teaching Garden", order: 2, total: 3 });
  const c1 = await doQuest("jv-c1", "5151", token), c2 = await doQuest("jv-c2", "5252", token);
  assert.equal(c1.earned.chainBonus, 0); assert.equal(c2.earned.chainBonus, 0);
  const before = (await call("GET", "bootstrap", null, token)).me.credits;
  const c3 = await doQuest("jv-c3", "5353", token);
  assert.equal(c3.earned.chainBonus, 60);
  assert(c3.newBadges.some((b) => b.slug === "chain-breaker"));
  s = await call("GET", "bootstrap", null, token);
  assert.equal(s.me.credits, before + c3.earned.credits + 60);
  assert(s.chains[0].steps.every((x) => x.done));

  // --- giver: only the giver login may post; the quest shows up for everyone ---
  await assert.rejects(() => call("GET", "giver/quests", null, token), /quest giver/);
  await assert.rejects(() => call("POST", "giver/quests", { title: "Nope", description: "Nope" }, token), /quest giver/);
  const giver = (await call("POST", "login", { email: "giver@rpgbirmingham.app", name: "Promise Team" })).token;
  const mine = await call("GET", "giver/quests", null, giver);
  assert(mine.length >= 4 && mine.every((x) => x.orgId === "promise" && /^\d{4}$/.test(x.verifyCode)));
  assert(!s.quests.some((x) => x.verifyCode), "verify codes never leak into the public quest list");
  if (s.backend === "memory" || process.env.SMOKE_GIVER === "1") {
    const posted = await call("POST", "giver/quests", {
      title: `Smoke quest ${Date.now()}`, description: "Created by the smoke test.", category: "cleanup",
      lat: 33.5207, lng: -86.8025, address: "Downtown (demo)", difficulty: 2, durationMin: 60, capacity: 3,
    }, giver);
    assert(/^\d{4}$/.test(posted.verifyCode) && posted.id.startsWith("gq-"));
    await assert.rejects(() => call("POST", "giver/quests", { title: "x", description: "bad" }, giver), /title/);
    s = await call("GET", "bootstrap", null, token);
    const seen = s.quests.find((x) => x.id === posted.id);
    assert(seen && seen.category === "cleanup" && seen.verifyCode === undefined, "posted quest is on the map for everyone");
    const run = await doQuest(posted.id, posted.verifyCode, token);
    assert(run.earned.credits > 0, "a giver-posted quest can be completed with its code");
  } else console.log("(skipping giver post: real database; set SMOKE_GIVER=1 to include it)");

  console.log("ledger entries:", s.ledger.length, "| rank:", s.myRank);
  console.log("SMOKE OK");
})().catch((e) => { console.error("SMOKE FAILED:", e.message); process.exit(1); });
