// Tiny data layer with two interchangeable backends:
//  - Supabase (Postgres) when SUPABASE_URL + a service key are set  -> persistent, used in production
//  - in-memory otherwise                                            -> zero-setup local demo (resets on restart)
// API: select(table, eq?) / insert(table, rows) / update(table, eq, patch) / upsert(table, rows)
const crypto = require("crypto");
const seed = require("./seed");

const TABLES = ["users", "orgs", "quests", "participations", "ledger", "offers", "redemptions", "causes", "donations"];

function seedRows() {
  return {
    orgs: seed.orgs,
    quests: seed.quests,
    offers: seed.offers,
    causes: seed.causes,
    users: seed.npcs.map((n) => ({ id: n.id, email: n.email, name: n.name, emoji: n.emoji, xp: n.xp, credits: n.credits, interests: n.interests, is_npc: true, klass: n.klass })),
    participations: seed.npcParticipations,
  };
}

function memoryBackend() {
  const t = Object.fromEntries(TABLES.map((n) => [n, []]));
  const rows = seedRows();
  for (const [name, list] of Object.entries(rows)) t[name] = list.map((r) => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...r }));
  const match = (r, eq) => !eq || Object.entries(eq).every(([k, v]) => r[k] === v);
  return {
    kind: "memory",
    async select(table, eq) { return t[table].filter((r) => match(r, eq)).map((r) => ({ ...r })); },
    async insert(table, list) {
      const arr = (Array.isArray(list) ? list : [list]).map((r) => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...r }));
      t[table].push(...arr);
      return arr.map((r) => ({ ...r }));
    },
    async update(table, eq, patch) {
      const out = [];
      for (const r of t[table]) if (match(r, eq)) { Object.assign(r, patch); out.push({ ...r }); }
      return out;
    },
    async upsert(table, list) {
      for (const row of list) {
        const ex = t[table].find((r) => r.id === row.id);
        if (ex) Object.assign(ex, row); else t[table].push({ created_at: new Date().toISOString(), ...row });
      }
    },
  };
}

function supabaseBackend(url, key) {
  const { createClient } = require("@supabase/supabase-js");
  const raw = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  // All tables live under an rpgb_ prefix so this can share a Supabase project with other apps.
  const sb = { from: (t) => raw.from("rpgb_" + t) };
  const check = (res) => { if (res.error) throw new Error(`supabase: ${res.error.message}`); return res.data; };
  let seeded = null;
  const ensureSeed = async () => {
    if (!seeded) seeded = (async () => {
      const { count, error } = await sb.from("orgs").select("id", { count: "exact", head: true });
      if (error) throw new Error(`supabase: ${error.message} (did you run supabase/schema.sql?)`);
      if (count > 0) {
        // already seeded: top up any quests added to the seed since (idempotent upsert by id)
        const { count: qn } = await sb.from("quests").select("id", { count: "exact", head: true });
        if ((qn || 0) < seed.quests.length) check(await sb.from("quests").upsert(seedRows().quests));
        return;
      }
      const rows = seedRows();
      // users/orgs/quests/offers/causes first, then participations (FK order)
      for (const name of ["orgs", "quests", "offers", "causes", "users"]) check(await sb.from(name).upsert(rows[name]));
      check(await sb.from("participations").upsert(rows.participations, { onConflict: "quest_id,user_id" }));
    })().catch((e) => { seeded = null; throw e; });
    return seeded;
  };
  const withEq = (qb, eq) => { for (const [k, v] of Object.entries(eq || {})) qb = qb.eq(k, v); return qb; };
  return {
    kind: "supabase",
    async select(table, eq) { await ensureSeed(); return check(await withEq(sb.from(table).select("*"), eq)); },
    async insert(table, list) { await ensureSeed(); return check(await sb.from(table).insert(list).select()); },
    async update(table, eq, patch) { await ensureSeed(); return check(await withEq(sb.from(table).update(patch), eq).select()); },
    async upsert(table, list) { await ensureSeed(); check(await sb.from(table).upsert(list)); },
  };
}

let backend;
function getDb() {
  if (backend) return backend;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  backend = url && key ? supabaseBackend(url, key) : memoryBackend();
  return backend;
}

module.exports = { getDb };
