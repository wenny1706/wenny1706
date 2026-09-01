-- ============================================================================
-- DG Content Engine - database schema
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
-- It is safe to run more than once.
--
-- This tool is single-user (Wenny only). Every table is locked so that only a
-- logged-in user can read or write anything. There are no client logins.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- CLIENTS  (one row per ghostwriting client)
-- ---------------------------------------------------------------------------
create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  logo_url      text,
  brand_primary text not null default '#E8BE5C',
  brand_secondary text not null default '#F3E3B3',
  calendar_color  text not null default '#E8BE5C', -- colour on the dashboard calendar
  website_url   text,
  socials       jsonb not null default '{}'::jsonb, -- { linkedin, instagram, tiktok }
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CLIENT PROFILE / VOICE VAULT  (one row per client)
-- Everything that makes a draft sound like the client, not like AI.
-- In v2 the AI generator will read from this table.
-- ---------------------------------------------------------------------------
create table if not exists client_profiles (
  client_id       uuid primary key references clients(id) on delete cascade,
  writing_samples text[] not null default array[]::text[],  -- up to 5 real posts
  voice_rules     text not null default '',
  banned_words    text[] not null default array[]::text[],
  target_audience text not null default '',
  offer_note      text not null default '',
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- LISTEN - raw material inbox
-- ---------------------------------------------------------------------------
create table if not exists notes (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  content    text not null,
  tag        text,
  note_date  date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists notes_client_idx on notes(client_id, note_date desc);

-- ---------------------------------------------------------------------------
-- PLAN - content pillars + monthly content map
-- ---------------------------------------------------------------------------
create table if not exists pillars (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references clients(id) on delete cascade,
  name           text not null,
  description    text not null default '',
  example_topics text not null default '',
  sort_order     int  not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists pillars_client_idx on pillars(client_id, sort_order);

create table if not exists plan_items (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  topic        text not null,
  format       text,
  channel      text,
  planned_date date,
  pillar_id    uuid references pillars(id) on delete set null,
  pushed_at    timestamptz,          -- set when pushed into the CREATE pipeline
  created_at   timestamptz not null default now()
);
create index if not exists plan_items_client_idx on plan_items(client_id, planned_date);

-- ---------------------------------------------------------------------------
-- CREATE - the kanban pipeline
-- status: idea | drafted | sent_for_approval | approved | posted
-- ---------------------------------------------------------------------------
create table if not exists content_items (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references clients(id) on delete cascade,
  title           text not null,
  channel         text not null default 'linkedin', -- linkedin|ig_feed|ig_reels|tiktok
  format          text,
  planned_date    date,
  draft_text      text not null default '',
  feedback_notes  text not null default '',
  status          text not null default 'idea',
  sort_order      int  not null default 0,
  sent_for_approval_at timestamptz,
  approved_at     timestamptz,
  posted_at       timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists content_items_client_idx on content_items(client_id, status, sort_order);
create index if not exists content_items_date_idx on content_items(planned_date);

-- ---------------------------------------------------------------------------
-- PUBLISH - Instagram feed planner grid (position 0..17 = 3 x 6)
-- ---------------------------------------------------------------------------
create table if not exists feed_slots (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references clients(id) on delete cascade,
  position        int  not null,
  image_url       text,
  post_type       text not null default 'photo', -- quote_card|reel_cover|carousel|photo
  label           text not null default '',
  content_item_id uuid references content_items(id) on delete set null,
  unique (client_id, position)
);

-- ---------------------------------------------------------------------------
-- LEARN - monthly report builder (numbers typed in by hand in v1)
-- ---------------------------------------------------------------------------
create table if not exists reports (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references clients(id) on delete cascade,
  month         date not null,               -- always the 1st of the month
  followers     text not null default '',
  reach         text not null default '',
  top_post      text not null default '',
  inquiries     text not null default '',
  learnings     text not null default '',
  created_at    timestamptz not null default now(),
  unique (client_id, month)
);

-- ---------------------------------------------------------------------------
-- HOOK LIBRARY - reusable ammunition across all clients
-- performance: worked_well | average | flopped
-- ---------------------------------------------------------------------------
create table if not exists hooks (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references clients(id) on delete set null,
  hook_text   text not null,
  channel     text,
  performance text not null default 'average',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- SECURITY: row level security, locked to logged-in users only.
-- ---------------------------------------------------------------------------
-- Written out table by table on purpose. An earlier version used a loop,
-- which works identically but makes Supabase's SQL checker warn that RLS
-- is missing, because it cannot read inside a loop.

alter table clients enable row level security;
drop policy if exists "signed in full access" on clients;
create policy "signed in full access" on clients
  for all to authenticated using (true) with check (true);

alter table client_profiles enable row level security;
drop policy if exists "signed in full access" on client_profiles;
create policy "signed in full access" on client_profiles
  for all to authenticated using (true) with check (true);

alter table notes enable row level security;
drop policy if exists "signed in full access" on notes;
create policy "signed in full access" on notes
  for all to authenticated using (true) with check (true);

alter table pillars enable row level security;
drop policy if exists "signed in full access" on pillars;
create policy "signed in full access" on pillars
  for all to authenticated using (true) with check (true);

alter table plan_items enable row level security;
drop policy if exists "signed in full access" on plan_items;
create policy "signed in full access" on plan_items
  for all to authenticated using (true) with check (true);

alter table content_items enable row level security;
drop policy if exists "signed in full access" on content_items;
create policy "signed in full access" on content_items
  for all to authenticated using (true) with check (true);

alter table feed_slots enable row level security;
drop policy if exists "signed in full access" on feed_slots;
create policy "signed in full access" on feed_slots
  for all to authenticated using (true) with check (true);

alter table reports enable row level security;
drop policy if exists "signed in full access" on reports;
create policy "signed in full access" on reports
  for all to authenticated using (true) with check (true);

alter table hooks enable row level security;
drop policy if exists "signed in full access" on hooks;
create policy "signed in full access" on hooks
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- STORAGE: bucket for client logos and Instagram feed images.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media public read"   on storage.objects;
drop policy if exists "media signed in write" on storage.objects;
create policy "media public read"
  on storage.objects for select using (bucket_id = 'media');
create policy "media signed in write"
  on storage.objects for all to authenticated
  using (bucket_id = 'media') with check (bucket_id = 'media');
