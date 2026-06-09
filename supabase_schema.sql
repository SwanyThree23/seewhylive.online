-- SeeWhy LIVE — Supabase Schema
-- Run this in: https://supabase.com/dashboard/project/rxlgywvfclyjdfyvfvyc/sql

-- ── Profiles (extends Supabase auth.users) ───────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  subscription_tier text default 'free' check (subscription_tier in ('free','bronze','silver','gold')),
  is_founding_member boolean default false,
  founding_member_number integer,
  role text default 'viewer' check (role in ('viewer','host','mod','admin')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- ── Streams ──────────────────────────────────────────────────
create table if not exists public.streams (
  id text primary key default gen_random_uuid()::text,
  creator_id uuid references public.profiles(id),
  creator_username text not null,
  title text not null,
  category text default 'general',
  thumbnail_url text,
  rtmp_key text,
  is_live boolean default false,
  viewer_count integer default 0,
  peak_viewers integer default 0,
  started_at timestamptz,
  ended_at timestamptz,
  paywall_enabled boolean default false,
  paywall_tier text default 'bronze',
  created_at timestamptz default now()
);

alter table public.streams enable row level security;

create policy "Live streams viewable by all"
  on streams for select using (true);

create policy "Creators can manage own streams"
  on streams for all using (auth.uid() = creator_id);

-- ── Stream Chat ───────────────────────────────────────────────
create table if not exists public.stream_chat (
  id bigserial primary key,
  stream_id text references public.streams(id) on delete cascade,
  user_id uuid,
  username text not null,
  message text not null,
  role text default 'viewer',
  is_founding_member boolean default false,
  is_moderated boolean default false,
  created_at timestamptz default now()
);

alter table public.stream_chat enable row level security;

create policy "Chat readable by all"
  on stream_chat for select using (true);

create policy "Authenticated users can chat"
  on stream_chat for insert with check (true);

-- Enable realtime for stream_chat
alter publication supabase_realtime add table stream_chat;

-- ── Tribute Transactions (90/10 enforced at DB level) ────────
create table if not exists public.tribute_transactions (
  id bigserial primary key,
  stream_id text references public.streams(id),
  sender_id uuid,
  username text not null,
  recipient_id uuid references public.profiles(id),
  gem_amount integer not null check (gem_amount > 0),
  -- 90/10 split enforced: creator gets floor(amount * 90 / 100)
  creator_gems integer generated always as (gem_amount * 90 / 100) stored,
  platform_gems integer generated always as (gem_amount - (gem_amount * 90 / 100)) stored,
  created_at timestamptz default now()
);

alter table public.tribute_transactions enable row level security;

create policy "Tributes readable by all"
  on tribute_transactions for select using (true);

create policy "Authenticated users can send tributes"
  on tribute_transactions for insert with check (true);

-- Enable realtime for tribute_transactions
alter publication supabase_realtime add table tribute_transactions;

-- ── Seed: SwanyThree23 founding member profile ───────────────
-- (Run after first auth signup with swanythree23@gmail.com)
-- insert into public.profiles (id, username, subscription_tier, is_founding_member, founding_member_number, role)
-- values ('<auth-uuid-here>', 'SwanyThree23', 'gold', true, 1, 'host')
-- on conflict (id) do update set subscription_tier='gold', is_founding_member=true, role='host';

-- ── Washington Classic 2026 stream row ───────────────────────
insert into public.streams (id, creator_username, title, category, is_live, paywall_enabled, paywall_tier)
values ('wc2026finals', 'SwanyThree23', 'Washington Classic 2026 — Championship Finals', 'domino', false, true, 'silver')
on conflict (id) do nothing;

insert into public.streams (id, creator_username, title, category, is_live)
values ('aiverse-live', 'SwanyThree23', 'AIverse Podcast — Live Edition', 'podcast', false)
on conflict (id) do nothing;
