// Applies supabase/schema.sql to the connected Supabase Postgres.
//   npx vercel env pull .env.local --yes   (gets POSTGRES_URL_NON_POOLING etc. from the Vercel/Supabase integration)
//   node scripts/apply-schema.js
// Or pass your own connection string:  DATABASE_URL=postgres://... node scripts/apply-schema.js
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnvFile(f) {
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}
loadEnvFile(path.join(__dirname, "..", ".env.local"));
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!url) { console.error("No DATABASE_URL / POSTGRES_URL_NON_POOLING found. Run `npx vercel env pull .env.local --yes` first."); process.exit(1); }

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, "..", "supabase", "schema.sql"), "utf8");
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  await c.query(sql);
  const r = await c.query("select count(*)::int as n from information_schema.tables where table_schema='public' and table_name in ('rpgb_orgs','rpgb_users','rpgb_quests','rpgb_participations','rpgb_ledger','rpgb_offers','rpgb_redemptions','rpgb_causes','rpgb_donations')");
  console.log(`schema applied. ${r.rows[0].n}/9 tables present. Seed data loads automatically on the first API request.`);
  await c.end();
})().catch((e) => { console.error("failed:", e.message); process.exit(1); });
