// Game rules + request handling. Pure-ish: all I/O goes through the db adapter (lib/db.js).
const crypto = require("crypto");
const { getDb } = require("./db");
const { scheduleFor, chicagoToday, overlaps } = require("./seed");

const ACTIVE = ["ACCEPTED", "CHECKED_IN"];
const CLASS_BY_CAT = { education: "teacher", food: "keeper", farm: "scout", tech: "builder", seniors: "healer", community: "healer" };
const CLASS_EMOJI = { wanderer: "🧭", builder: "🔨", healer: "💚", scout: "🌿", teacher: "📚", keeper: "🍞", bard: "🎸" };
const BADGES = [
  { slug: "first-steps", name: "First Steps", icon: "👣", description: "Complete your first quest" },
  { slug: "regular", name: "Regular", icon: "⭐", description: "Complete 5 quests" },
  { slug: "explorer", name: "Community Explorer", icon: "🧭", description: "Help 3 different organizations" },
  { slug: "team-player", name: "Team Player", icon: "🤝", description: "Complete a group quest" },
  { slug: "patron", name: "Patron", icon: "💛", description: "Donate credits to a cause" },
];
const STARTER_CREDITS = 40;

class HttpError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }
const bad = (code, message, status = 400) => new HttpError(status, code, message);

const levelOf = (xp) => 1 + Math.floor(Math.sqrt(xp / 40));
const xpForLevel = (n) => 40 * (n - 1) * (n - 1);
function levelInfo(xp) {
  const level = levelOf(xp), base = xpForLevel(level), next = xpForLevel(level + 1);
  return { level, xpIntoLevel: xp - base, xpForNext: next - base, pct: Math.round(((xp - base) / (next - base)) * 100) };
}

// ---- session tokens (demo-grade: signed, no passwords) ----
const SECRET = () => process.env.SESSION_SECRET || "dev-only-change-me-please-32-chars!!";
const b64 = (s) => Buffer.from(s).toString("base64url");
const sign = (p) => crypto.createHmac("sha256", SECRET()).update(p).digest("base64url");
function makeToken(uid) { const p = b64(JSON.stringify({ uid, exp: Date.now() + 7 * 864e5 })); return `${p}.${sign(p)}`; }
function readToken(tok) {
  if (!tok) return null;
  const [p, s] = String(tok).split(".");
  if (!p || !s) return null;
  const want = sign(p);
  if (s.length !== want.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(want))) return null;
  try { const o = JSON.parse(Buffer.from(p, "base64url").toString()); return o.exp > Date.now() ? o.uid : null; } catch { return null; }
}

// ---- derived profile stuff ----
function profileOf(user, ctx) {
  const mine = ctx.parts.filter((p) => p.user_id === user.id);
  const done = mine.filter((p) => p.status === "COMPLETED").map((p) => ({ p, q: ctx.questById[p.quest_id] })).filter((x) => x.q);
  const counts = {};
  for (const { q } of done) { const k = CLASS_BY_CAT[q.category] || "wanderer"; counts[k] = (counts[k] || 0) + 1; }
  let klass = user.klass || "wanderer";
  if (!user.is_npc) { // players' class is derived from their completions; NPCs keep their seeded class
    klass = "wanderer"; let best = 0;
    for (const [k, n] of Object.entries(counts)) if (n > best) { best = n; klass = k; }
  }
  const donations = ctx.donations.filter((d) => d.user_id === user.id);
  const orgsHelped = new Set(done.map((x) => x.q.org_id));
  const earned = new Set();
  if (done.length >= 1) earned.add("first-steps");
  if (done.length >= 5) earned.add("regular");
  if (orgsHelped.size >= 3) earned.add("explorer");
  if (done.some((x) => x.q.capacity > 1)) earned.add("team-player");
  if (donations.length) earned.add("patron");
  return {
    klass, emoji: CLASS_EMOJI[klass], badges: BADGES.filter((b) => earned.has(b.slug)),
    stats: { questsCompleted: done.length, orgsHelped: orgsHelped.size, creditsDonated: donations.reduce((a, d) => a + d.amount, 0) },
  };
}

async function loadCtx(db) {
  const [users, quests, parts, donations] = await Promise.all([db.select("users"), db.select("quests"), db.select("participations"), db.select("donations")]);
  return { users, quests, parts, donations, questById: Object.fromEntries(quests.map((q) => [q.id, q])), userById: Object.fromEntries(users.map((u) => [u.id, u])) };
}

const meDTO = (user, ctx) => {
  const pr = profileOf(user, ctx), lv = levelInfo(user.xp);
  return { id: user.id, name: user.name, email: user.email, xp: user.xp, credits: user.credits, interests: (user.interests || "").split(",").filter(Boolean),
    klass: pr.klass, emoji: pr.emoji, avatarEmoji: user.emoji, badges: pr.badges, stats: pr.stats, ...lv };
};

async function bootstrap(db, uid) {
  const ctx = await loadCtx(db);
  const [orgs, offers, causes] = await Promise.all([db.select("orgs"), db.select("offers"), db.select("causes")]);
  const me = uid ? ctx.userById[uid] : null;
  const quests = ctx.quests.map((q) => {
    const parts = ctx.parts.filter((p) => p.quest_id === q.id);
    const active = parts.filter((p) => ACTIVE.includes(p.status));
    const mineP = me && parts.find((p) => p.user_id === me.id);
    return {
      ...scheduleFor(q.id), id: q.id, orgId: q.org_id, title: q.title, description: q.description, category: q.category, tags: (q.tags || "").split(",").filter(Boolean),
      lat: q.lat, lng: q.lng, address: q.address, difficulty: q.difficulty, durationMin: q.duration_min, rewardCredits: q.reward_credits, rewardXp: q.reward_xp,
      capacity: q.capacity, spotsLeft: Math.max(0, q.capacity - active.length), myStatus: mineP ? mineP.status : null,
      // DEMO: reveal the host's code once you've checked in (so the demo is playable). Set DEMO_MODE=false to hide.
      demoCode: process.env.DEMO_MODE !== "false" && mineP && mineP.status === "CHECKED_IN" ? q.verify_code : undefined,
      party: parts.filter((p) => p.status !== "ABANDONED").slice(0, 8).map((p) => { const u = ctx.userById[p.user_id]; return u && { name: u.name, emoji: u.emoji, isMe: !!me && u.id === me.id }; }).filter(Boolean),
    };
  });
  const board = ctx.users.slice().sort((a, b) => b.xp - a.xp).slice(0, 25)
    .map((u, i) => ({ rank: i + 1, name: u.name, emoji: u.emoji, klass: profileOf(u, ctx).klass, level: levelOf(u.xp), xp: u.xp, isMe: !!me && u.id === me.id }));
  let myRank = null;
  if (me) myRank = ctx.users.slice().sort((a, b) => b.xp - a.xp).findIndex((u) => u.id === me.id) + 1;
  const out = {
    backend: db.kind, orgs, quests, leaderboard: board, myRank,
    offers: offers.map((o) => ({ id: o.id, sponsor: o.sponsor_name, emoji: o.emoji, title: o.title, description: o.description, cost: o.cost_credits, stock: o.stock })),
    causes: causes.map((c) => ({ id: c.id, orgId: c.org_id, title: c.title, description: c.description, goal: c.goal_credits, raised: c.raised_credits })),
    badgeDefs: BADGES, classEmoji: CLASS_EMOJI,
  };
  if (me) {
    out.me = meDTO(me, ctx);
    const [ledger, reds] = await Promise.all([db.select("ledger", { user_id: me.id }), db.select("redemptions", { user_id: me.id })]);
    out.ledger = ledger.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 25).map((l) => ({ delta: l.delta, kind: l.kind, note: l.note, at: l.created_at }));
    const offerById = Object.fromEntries(offers.map((o) => [o.id, o]));
    out.redemptions = reds.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).map((r) => ({ code: r.code, title: offerById[r.offer_id]?.title, sponsor: offerById[r.offer_id]?.sponsor_name, at: r.created_at }));
  }
  return out;
}

const need = (uid) => { if (!uid) throw bad("UNAUTHENTICATED", "Please sign in first.", 401); return uid; };
const code5 = () => Array.from(crypto.randomBytes(5), (b) => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[b % 31]).join("");

async function questAction(db, uid, questId, action, body) {
  need(uid);
  const [quest] = await db.select("quests", { id: questId });
  if (!quest) throw bad("NOT_FOUND", "Quest not found.", 404);
  const [user] = await db.select("users", { id: uid });
  if (!user) throw bad("UNAUTHENTICATED", "Please sign in again.", 401);
  const [part] = await db.select("participations", { quest_id: questId, user_id: uid });
  const now = new Date().toISOString();

  if (action === "accept") {
    if (part && ACTIVE.includes(part.status)) throw bad("CONFLICT", "You are already signed up for this quest.", 409);
    if (part && part.status === "COMPLETED") throw bad("CONFLICT", "You already completed this quest.", 409);
    const all = await db.select("participations", { quest_id: questId });
    if (all.filter((p) => ACTIVE.includes(p.status)).length >= quest.capacity) throw bad("QUEST_FULL", "This quest is full.", 409);
    // no two overlapping activities (same date, overlapping times)
    const mine = (await db.select("participations", { user_id: uid })).filter((p) => ACTIVE.includes(p.status) && p.quest_id !== questId);
    if (mine.length) {
      const here = scheduleFor(quest.id);
      const others = await db.select("quests");
      for (const p of mine) {
        const o = others.find((x) => x.id === p.quest_id);
        if (o && overlaps(here, quest.duration_min, scheduleFor(o.id), o.duration_min)) throw bad("CONFLICT", `That overlaps with "${o.title}" (${scheduleFor(o.id).time} on the same day). Cancel it first or pick another time.`, 409);
      }
    }
    if (part) await db.update("participations", { id: part.id }, { status: "ACCEPTED", accepted_at: now });
    else await db.insert("participations", { quest_id: questId, user_id: uid, status: "ACCEPTED", accepted_at: now });
    return {};
  }
  if (!part) throw bad("CONFLICT", "Accept the quest first.", 409);
  if (action === "checkin") {
    if (part.status !== "ACCEPTED") throw bad("CONFLICT", "Sign up for the quest first.", 409);
    const sched = scheduleFor(quest.id);
    // "today" = Birmingham's date, or the player's own date (sent by the app) when they're in another timezone
    const hinted = /^\d{4}-\d{2}-\d{2}$/.test(String(body.today || "")) ? body.today : null;
    const nearChicago = hinted && Math.abs(Date.parse(hinted) - Date.parse(chicagoToday())) <= 86400000;
    if (sched.date !== chicagoToday() && !(nearChicago && sched.date === hinted)) throw bad("CONFLICT", `This quest is scheduled for ${sched.date}. You can check in on the day.`, 409);
    // DEMO: GPS distance is not checked. A real build would require being within ~250 m of the site.
    await db.update("participations", { id: part.id }, { status: "CHECKED_IN", checked_in_at: now });
    return {};
  }
  if (action === "abandon") {
    if (!ACTIVE.includes(part.status)) throw bad("CONFLICT", "Nothing to abandon.", 409);
    await db.update("participations", { id: part.id }, { status: "ABANDONED" });
    return {};
  }
  if (action === "complete") {
    if (part.status !== "CHECKED_IN") throw bad("CONFLICT", "Check in at the site first.", 409);
    if (String(body.code || "").trim() !== quest.verify_code) throw bad("BAD_CODE", "That code doesn't match. Ask the host for the 4-digit code.", 400);
    const before = await loadCtx(db);
    const beforeBadges = profileOf(before.userById[uid], before).badges.map((b) => b.slug);
    await db.update("participations", { id: part.id }, { status: "COMPLETED", completed_at: now });
    const newXp = user.xp + quest.reward_xp;
    await db.insert("ledger", { user_id: uid, delta: quest.reward_credits, kind: "EARN", note: `Completed "${quest.title}"` });
    await db.update("users", { id: uid }, { xp: newXp, credits: user.credits + quest.reward_credits });
    const after = await loadCtx(db);
    const prof = profileOf(after.userById[uid], after);
    await db.update("users", { id: uid }, { klass: prof.klass });
    return {
      earned: { credits: quest.reward_credits, xp: quest.reward_xp },
      levelUp: levelOf(newXp) > levelOf(user.xp), level: levelOf(newXp), klass: prof.klass, klassEmoji: prof.emoji,
      newBadges: prof.badges.filter((b) => !beforeBadges.includes(b.slug)),
    };
  }
  throw bad("NOT_FOUND", "Unknown action.", 404);
}

async function redeem(db, uid, body) {
  need(uid);
  const [offer] = await db.select("offers", { id: String(body.offerId || "") });
  const [user] = await db.select("users", { id: uid });
  if (!offer) throw bad("NOT_FOUND", "Offer not found.", 404);
  if (offer.stock <= 0) throw bad("CONFLICT", "Sold out.", 409);
  if (user.credits < offer.cost_credits) throw bad("INSUFFICIENT_CREDITS", "Not enough credits yet. Go complete a quest!", 400);
  const code = "RPGB-" + code5();
  await db.update("users", { id: uid }, { credits: user.credits - offer.cost_credits });
  await db.update("offers", { id: offer.id }, { stock: offer.stock - 1 });
  await db.insert("redemptions", { user_id: uid, offer_id: offer.id, code });
  await db.insert("ledger", { user_id: uid, delta: -offer.cost_credits, kind: "SPEND", note: `Redeemed ${offer.title} @ ${offer.sponsor_name}` });
  return { code, title: offer.title, sponsor: offer.sponsor_name };
}

async function donate(db, uid, body) {
  need(uid);
  const amount = Math.floor(Number(body.amount));
  const [cause] = await db.select("causes", { id: String(body.causeId || "") });
  const [user] = await db.select("users", { id: uid });
  if (!cause) throw bad("NOT_FOUND", "Cause not found.", 404);
  if (!(amount > 0)) throw bad("INVALID_INPUT", "Pick an amount to donate.", 400);
  if (user.credits < amount) throw bad("INSUFFICIENT_CREDITS", "Not enough credits.", 400);
  await db.update("users", { id: uid }, { credits: user.credits - amount });
  await db.update("causes", { id: cause.id }, { raised_credits: cause.raised_credits + amount });
  await db.insert("donations", { user_id: uid, cause_id: cause.id, amount });
  await db.insert("ledger", { user_id: uid, delta: -amount, kind: "DONATE", note: `Donated to "${cause.title}"` });
  return { amount, title: cause.title };
}

async function people(db, uid) {
  need(uid);
  const ctx = await loadCtx(db);
  const me = ctx.userById[uid];
  const mine = new Set((me.interests || "").split(",").filter(Boolean));
  const myParts = new Set(ctx.parts.filter((p) => p.user_id === uid && p.status !== "ABANDONED").map((p) => p.quest_id));
  const myClass = profileOf(me, ctx).klass;
  return ctx.users.filter((u) => u.id !== uid).map((u) => {
    const shared = (u.interests || "").split(",").filter((i) => mine.has(i));
    const sharedQuests = ctx.parts.filter((p) => p.user_id === u.id && p.status !== "ABANDONED" && myParts.has(p.quest_id)).map((p) => ctx.questById[p.quest_id]?.title).filter(Boolean);
    const klass = profileOf(u, ctx).klass;
    const score = 3 * shared.length + (klass === myClass && klass !== "wanderer" ? 2 : 0) + 2 * sharedQuests.length;
    const bits = [];
    if (shared.length) bits.push("Both into " + shared.join(", "));
    if (sharedQuests.length) bits.push("Both on “" + sharedQuests[0] + "”");
    return { name: u.name, emoji: u.emoji, klass, level: levelOf(u.xp), score, shared, sharedQuests, reason: bits.join(" · ") || "Fellow adventurer" };
  }).sort((a, b) => b.score - a.score).slice(0, 8);
}

async function login(db, body) {
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim().slice(0, 24) || email.split("@")[0];
  if (!/^[^@\s]{1,64}@[^@\s]{1,120}\.[^@\s]{2,}$/.test(email)) throw bad("INVALID_INPUT", "Enter a valid email (any email works for this demo).", 400);
  const interests = (Array.isArray(body.interests) ? body.interests : []).map(String).filter((s) => /^[a-z]{2,20}$/.test(s)).slice(0, 8).join(",");
  let [user] = await db.select("users", { email });
  if (!user) {
    const emojis = ["🧭", "🦊", "🐢", "🦉", "🐝", "🦄", "🐙", "🌵"];
    [user] = await db.insert("users", { email, name, emoji: emojis[Math.floor(Math.random() * emojis.length)], xp: 0, credits: STARTER_CREDITS, interests, is_npc: false, klass: "wanderer" });
    await db.insert("ledger", { user_id: user.id, delta: STARTER_CREDITS, kind: "BONUS", note: "Welcome bonus" });
  } else if (interests) {
    await db.update("users", { id: user.id }, { interests });
  }
  return { token: makeToken(user.id) };
}

async function profile(db, uid, body) {
  need(uid);
  const patch = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim().slice(0, 24);
  if (Array.isArray(body.interests)) patch.interests = body.interests.map(String).filter((s) => /^[a-z]{2,20}$/.test(s)).slice(0, 8).join(",");
  if (Object.keys(patch).length) await db.update("users", { id: uid }, patch);
  return {};
}

// Route: returns data (throws HttpError on failure)
async function route(method, path, body, token) {
  const db = getDb();
  const uid = readToken(token);
  const seg = path.replace(/^\/+|\/+$/g, "").split("/");
  const key = `${method} ${seg[0]}${seg[2] ? "/:id/" + seg[2] : ""}`;
  switch (key) {
    case "GET bootstrap": return bootstrap(db, uid);
    case "POST login": return login(db, body || {});
    case "POST profile": return profile(db, uid, body || {});
    case "POST redeem": return redeem(db, uid, body || {});
    case "POST donate": return donate(db, uid, body || {});
    case "GET people": return people(db, uid);
    case "GET health": return { ok: true, backend: db.kind };
    default:
      if (method === "POST" && seg[0] === "quests" && seg[1] && seg[2]) return questAction(db, uid, seg[1], seg[2], body || {});
      throw bad("NOT_FOUND", "Unknown route.", 404);
  }
}

module.exports = { route, HttpError, levelInfo, levelOf };
