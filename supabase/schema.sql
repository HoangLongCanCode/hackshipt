-- RPG Birmingham demo schema. All tables are prefixed rpgb_ so this is safe to run in a Supabase project that has other tables. Run once in Supabase (SQL editor) or via `supabase db push`.
-- The app talks to these tables only from Vercel serverless functions using the service-role key,
-- so RLS is enabled with NO policies (the public anon key can read/write nothing).
-- Seed rows are inserted automatically by the API on first request when `orgs` is empty.

create table if not exists rpgb_orgs (
  id text primary key, name text not null, emoji text, color text, description text
);

create table if not exists rpgb_users (
  id text primary key default gen_random_uuid()::text,
  email text unique not null,
  name text not null,
  emoji text default '🧭',
  xp int not null default 0,
  credits int not null default 0 check (credits >= 0),
  interests text not null default '',
  is_npc boolean not null default false,
  klass text not null default 'wanderer',
  created_at timestamptz not null default now()
);

-- Taste matching (added after the first deploy; safe to re-run).
alter table rpgb_users add column if not exists favorite_artist text not null default '';
alter table rpgb_users add column if not exists hobby text not null default '';

create table if not exists rpgb_quests (
  id text primary key,
  org_id text not null references rpgb_orgs(id),
  title text not null, description text not null,
  category text not null, tags text not null default '',
  lat double precision not null, lng double precision not null, address text,
  difficulty int not null default 1, duration_min int not null,
  reward_credits int not null, reward_xp int not null,
  capacity int not null default 1, verify_code text not null,
  created_at timestamptz not null default now()
);

create table if not exists rpgb_participations (
  id uuid primary key default gen_random_uuid(),
  quest_id text not null references rpgb_quests(id),
  user_id text not null references rpgb_users(id),
  status text not null default 'ACCEPTED',   -- ACCEPTED | CHECKED_IN | COMPLETED | ABANDONED
  accepted_at timestamptz not null default now(),
  checked_in_at timestamptz, completed_at timestamptz,
  unique (quest_id, user_id)
);

create table if not exists rpgb_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references rpgb_users(id),
  delta int not null, kind text not null, note text not null,
  created_at timestamptz not null default now()
);
create index if not exists rpgb_ledger_user_idx on rpgb_ledger(user_id);

create table if not exists rpgb_offers (
  id text primary key, sponsor_name text not null, emoji text,
  title text not null, description text, cost_credits int not null, stock int not null default 50
);

create table if not exists rpgb_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references rpgb_users(id),
  offer_id text not null references rpgb_offers(id),
  code text not null, created_at timestamptz not null default now()
);

create table if not exists rpgb_causes (
  id text primary key, org_id text not null references rpgb_orgs(id),
  title text not null, description text,
  goal_credits int not null, raised_credits int not null default 0
);

create table if not exists rpgb_donations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references rpgb_users(id),
  cause_id text not null references rpgb_causes(id),
  amount int not null check (amount > 0), created_at timestamptz not null default now()
);

alter table rpgb_orgs enable row level security;
alter table rpgb_users enable row level security;
alter table rpgb_quests enable row level security;
alter table rpgb_participations enable row level security;
alter table rpgb_ledger enable row level security;
alter table rpgb_offers enable row level security;
alter table rpgb_redemptions enable row level security;
alter table rpgb_causes enable row level security;
alter table rpgb_donations enable row level security;
