-- SeeWhy LIVE v33 — Complete Supabase Schema
-- Project: rxlgywvfclyjdfyvfvyc
-- Run at: https://supabase.com/dashboard/project/rxlgywvfclyjdfyvfvyc/sql
-- CREATOR_SPLIT = 90%  |  PLATFORM_FEE = 10%  |  Math.floor() always

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- EXTENSIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. PROFILES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
create table if not exists public.profiles (
  id                   uuid references auth.users on delete cascade primary key,
  username             text unique not null,
  display_name         text,
  avatar_url           text,
  bio                  text,
  subscription_tier    text default 'free' check (subscription_tier in ('free','bronze','silver','gold')),
  is_founding_member   boolean default false,
  founding_member_number integer,
  role                 text default 'viewer' check (role in ('viewer','host','mod','admin')),
  gem_balance          integer default 0 check (gem_balance >= 0),
  total_earnings_cents integer default 0,
  stripe_connect_id    text,
  is_banned            boolean default false,
  ban_reason           text,
  onboarding_complete  boolean default false,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_all"  on profiles for select using (true);
create policy "profiles_update_own"  on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own"  on profiles for insert with check (auth.uid() = id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. STREAMS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
create table if not exists public.streams (
  id               text primary key default gen_random_uuid()::text,
  creator_id       uuid references public.profiles(id) on delete set null,
  creator_username text not null,
  title            text not null,
  description      text,
  category         text default 'general',
  thumbnail_url    text,
  rtmp_key         text unique,
  scene            text default 'main',
  is_live          boolean default false,
  viewer_count     integer default 0,
  peak_viewers     integer default 0,
  total_messages   integer default 0,
  started_at       timestamptz,
  ended_at         timestamptz,
  paywall_enabled  boolean default false,
  paywall_tier     text default 'bronze',
  tags             text[] default '{}',
  created_at       timestamptz default now()
);

alter table public.streams enable row level security;

create policy "streams_select_all"      on streams for select using (true);
create policy "streams_manage_own"      on streams for all using (auth.uid() = creator_id);
create policy "streams_insert_anon"     on streams for insert with check (true);

alter publication supabase_realtime add table streams;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. STREAM CHAT
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
create table if not exists public.stream_chat (
  id                bigserial primary key,
  stream_id         text references public.streams(id) on delete cascade,
  user_id           uuid,
  username          text not null,
  message           text not null,
  role              text default 'viewer',
  is_founding_member boolean default false,
  is_moderated      boolean default false,
  guardian_score    float default 0,
  created_at        timestamptz default now()
);

alter table public.stream_chat enable row level security;

create policy "chat_select_all"    on stream_chat for select using (true);
create policy "chat_insert_all"    on stream_chat for insert with check (true);

alter publication supabase_realtime add table stream_chat;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. TRIBUTE TRANSACTIONS (90/10 enforced at DB level)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
create table if not exists public.tribute_transactions (
  id                  bigserial primary key,
  stream_id           text references public.streams(id) on delete set null,
  sender_id           uuid references public.profiles(id) on delete set null,
  recipient_id        uuid references public.profiles(id) on delete set null,
  gem_type            text not null check (gem_type in ('ruby','gold','diamond','purple','bone')),
  quantity            integer not null default 1 check (quantity > 0),
  total_cents         integer not null check (total_cents > 0),
  -- 90/10 split: floor(total * 90/100) — NEVER round up creator share
  creator_cents       integer generated always as (floor(total_cents * 90 / 100)::integer) stored,
  platform_cents      integer generated always as (total_cents - floor(total_cents * 90 / 100)::integer) stored,
  paid_out            boolean default false,
  payout_transfer_id  text,
  paid_out_at         timestamptz,
  created_at          timestamptz default now()
);

alter table public.tribute_transactions enable row level security;

create policy "tributes_select_all"   on tribute_transactions for select using (true);
create policy "tributes_insert_all"   on tribute_transactions for insert with check (true);

alter publication supabase_realtime add table tribute_transactions;

-- DB trigger: update creator gem_balance and total_earnings on tribute insert
create or replace function public.handle_tribute_insert()
returns trigger language plpgsql security definer as $$
begin
  -- Credit creator (floor already applied via generated column)
  update public.profiles
    set gem_balance          = gem_balance + NEW.creator_cents,
        total_earnings_cents = total_earnings_cents + NEW.creator_cents,
        updated_at           = now()
  where id = NEW.recipient_id;
  return NEW;
end;
$$;

drop trigger if exists on_tribute_insert on public.tribute_transactions;
create trigger on_tribute_insert
  after insert on public.tribute_transactions
  for each row execute function public.handle_tribute_insert();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. SUBSCRIPTIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
create table if not exists public.subscriptions (
  id                      bigserial primary key,
  subscriber_id           uuid references public.profiles(id) on delete cascade,
  creator_id              uuid references public.profiles(id) on delete cascade,
  tier                    text not null check (tier in ('bronze','silver','gold')),
  stripe_subscription_id  text unique,
  active                  boolean default true,
  started_at              timestamptz default now(),
  cancelled_at            timestamptz,
  unique (subscriber_id, creator_id)
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on subscriptions for select using (
  auth.uid() = subscriber_id or auth.uid() = creator_id
);
create policy "subscriptions_insert_own" on subscriptions for insert with check (true);
create policy "subscriptions_update_own" on subscriptions for update using (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. ACTIVITIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
create table if not exists public.activities (
  id            bigserial primary key,
  user_id       uuid references public.profiles(id) on delete cascade,
  type          text not null,
  title         text not null,
  amount        integer,
  recipient_id  uuid,
  sender_id     uuid,
  metadata      jsonb default '{}',
  created_at    timestamptz default now()
);

alter table public.activities enable row level security;

create policy "activities_select_own" on activities for select using (auth.uid() = user_id);
create policy "activities_insert_all" on activities for insert with check (true);

create index if not exists activities_user_id_idx on activities(user_id, created_at desc);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 7. MODERATION ACTIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
create table if not exists public.moderation_actions (
  id          bigserial primary key,
  user_id     uuid references public.profiles(id) on delete set null,
  stream_id   text,
  action      text not null check (action in ('auto_ban','warn','flag','manual_ban','unban','timeout')),
  score       float,
  reason      text,
  text        text,
  moderator_id uuid,
  created_at  timestamptz default now()
);

alter table public.moderation_actions enable row level security;

create policy "moderation_insert_all"  on moderation_actions for insert with check (true);
create policy "moderation_select_mods" on moderation_actions for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('mod','admin'))
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 8. INVITE CODES (100 founding member codes)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
create table if not exists public.invite_codes (
  id               bigserial primary key,
  code             text unique not null,
  tier             text default 'bronze' check (tier in ('bronze','silver','gold')),
  is_founding      boolean default true,
  founding_number  integer,
  used_at          timestamptz,
  used_by          uuid references public.profiles(id) on delete set null,
  created_at       timestamptz default now()
);

alter table public.invite_codes enable row level security;

create policy "invite_select_all"  on invite_codes for select using (true);
create policy "invite_update_all"  on invite_codes for update using (true);

-- Seed 100 founding member invite codes
-- Tier distribution: 1 gold (SwanyThree23), 19 silver, 80 bronze
insert into public.invite_codes (code, tier, is_founding, founding_number) values
  ('SEEWHY-FOUNDING-001', 'gold',   true, 1),
  ('SEEWHY-FOUNDING-002', 'silver', true, 2),
  ('SEEWHY-FOUNDING-003', 'silver', true, 3),
  ('SEEWHY-FOUNDING-004', 'silver', true, 4),
  ('SEEWHY-FOUNDING-005', 'silver', true, 5),
  ('SEEWHY-FOUNDING-006', 'silver', true, 6),
  ('SEEWHY-FOUNDING-007', 'silver', true, 7),
  ('SEEWHY-FOUNDING-008', 'silver', true, 8),
  ('SEEWHY-FOUNDING-009', 'silver', true, 9),
  ('SEEWHY-FOUNDING-010', 'silver', true, 10),
  ('SEEWHY-FOUNDING-011', 'silver', true, 11),
  ('SEEWHY-FOUNDING-012', 'silver', true, 12),
  ('SEEWHY-FOUNDING-013', 'silver', true, 13),
  ('SEEWHY-FOUNDING-014', 'silver', true, 14),
  ('SEEWHY-FOUNDING-015', 'silver', true, 15),
  ('SEEWHY-FOUNDING-016', 'silver', true, 16),
  ('SEEWHY-FOUNDING-017', 'silver', true, 17),
  ('SEEWHY-FOUNDING-018', 'silver', true, 18),
  ('SEEWHY-FOUNDING-019', 'silver', true, 19),
  ('SEEWHY-FOUNDING-020', 'silver', true, 20),
  ('SEEWHY-FOUNDING-021', 'bronze', true, 21),
  ('SEEWHY-FOUNDING-022', 'bronze', true, 22),
  ('SEEWHY-FOUNDING-023', 'bronze', true, 23),
  ('SEEWHY-FOUNDING-024', 'bronze', true, 24),
  ('SEEWHY-FOUNDING-025', 'bronze', true, 25),
  ('SEEWHY-FOUNDING-026', 'bronze', true, 26),
  ('SEEWHY-FOUNDING-027', 'bronze', true, 27),
  ('SEEWHY-FOUNDING-028', 'bronze', true, 28),
  ('SEEWHY-FOUNDING-029', 'bronze', true, 29),
  ('SEEWHY-FOUNDING-030', 'bronze', true, 30),
  ('SEEWHY-FOUNDING-031', 'bronze', true, 31),
  ('SEEWHY-FOUNDING-032', 'bronze', true, 32),
  ('SEEWHY-FOUNDING-033', 'bronze', true, 33),
  ('SEEWHY-FOUNDING-034', 'bronze', true, 34),
  ('SEEWHY-FOUNDING-035', 'bronze', true, 35),
  ('SEEWHY-FOUNDING-036', 'bronze', true, 36),
  ('SEEWHY-FOUNDING-037', 'bronze', true, 37),
  ('SEEWHY-FOUNDING-038', 'bronze', true, 38),
  ('SEEWHY-FOUNDING-039', 'bronze', true, 39),
  ('SEEWHY-FOUNDING-040', 'bronze', true, 40),
  ('SEEWHY-FOUNDING-041', 'bronze', true, 41),
  ('SEEWHY-FOUNDING-042', 'bronze', true, 42),
  ('SEEWHY-FOUNDING-043', 'bronze', true, 43),
  ('SEEWHY-FOUNDING-044', 'bronze', true, 44),
  ('SEEWHY-FOUNDING-045', 'bronze', true, 45),
  ('SEEWHY-FOUNDING-046', 'bronze', true, 46),
  ('SEEWHY-FOUNDING-047', 'bronze', true, 47),
  ('SEEWHY-FOUNDING-048', 'bronze', true, 48),
  ('SEEWHY-FOUNDING-049', 'bronze', true, 49),
  ('SEEWHY-FOUNDING-050', 'bronze', true, 50),
  ('SEEWHY-FOUNDING-051', 'bronze', true, 51),
  ('SEEWHY-FOUNDING-052', 'bronze', true, 52),
  ('SEEWHY-FOUNDING-053', 'bronze', true, 53),
  ('SEEWHY-FOUNDING-054', 'bronze', true, 54),
  ('SEEWHY-FOUNDING-055', 'bronze', true, 55),
  ('SEEWHY-FOUNDING-056', 'bronze', true, 56),
  ('SEEWHY-FOUNDING-057', 'bronze', true, 57),
  ('SEEWHY-FOUNDING-058', 'bronze', true, 58),
  ('SEEWHY-FOUNDING-059', 'bronze', true, 59),
  ('SEEWHY-FOUNDING-060', 'bronze', true, 60),
  ('SEEWHY-FOUNDING-061', 'bronze', true, 61),
  ('SEEWHY-FOUNDING-062', 'bronze', true, 62),
  ('SEEWHY-FOUNDING-063', 'bronze', true, 63),
  ('SEEWHY-FOUNDING-064', 'bronze', true, 64),
  ('SEEWHY-FOUNDING-065', 'bronze', true, 65),
  ('SEEWHY-FOUNDING-066', 'bronze', true, 66),
  ('SEEWHY-FOUNDING-067', 'bronze', true, 67),
  ('SEEWHY-FOUNDING-068', 'bronze', true, 68),
  ('SEEWHY-FOUNDING-069', 'bronze', true, 69),
  ('SEEWHY-FOUNDING-070', 'bronze', true, 70),
  ('SEEWHY-FOUNDING-071', 'bronze', true, 71),
  ('SEEWHY-FOUNDING-072', 'bronze', true, 72),
  ('SEEWHY-FOUNDING-073', 'bronze', true, 73),
  ('SEEWHY-FOUNDING-074', 'bronze', true, 74),
  ('SEEWHY-FOUNDING-075', 'bronze', true, 75),
  ('SEEWHY-FOUNDING-076', 'bronze', true, 76),
  ('SEEWHY-FOUNDING-077', 'bronze', true, 77),
  ('SEEWHY-FOUNDING-078', 'bronze', true, 78),
  ('SEEWHY-FOUNDING-079', 'bronze', true, 79),
  ('SEEWHY-FOUNDING-080', 'bronze', true, 80),
  ('SEEWHY-FOUNDING-081', 'bronze', true, 81),
  ('SEEWHY-FOUNDING-082', 'bronze', true, 82),
  ('SEEWHY-FOUNDING-083', 'bronze', true, 83),
  ('SEEWHY-FOUNDING-084', 'bronze', true, 84),
  ('SEEWHY-FOUNDING-085', 'bronze', true, 85),
  ('SEEWHY-FOUNDING-086', 'bronze', true, 86),
  ('SEEWHY-FOUNDING-087', 'bronze', true, 87),
  ('SEEWHY-FOUNDING-088', 'bronze', true, 88),
  ('SEEWHY-FOUNDING-089', 'bronze', true, 89),
  ('SEEWHY-FOUNDING-090', 'bronze', true, 90),
  ('SEEWHY-FOUNDING-091', 'bronze', true, 91),
  ('SEEWHY-FOUNDING-092', 'bronze', true, 92),
  ('SEEWHY-FOUNDING-093', 'bronze', true, 93),
  ('SEEWHY-FOUNDING-094', 'bronze', true, 94),
  ('SEEWHY-FOUNDING-095', 'bronze', true, 95),
  ('SEEWHY-FOUNDING-096', 'bronze', true, 96),
  ('SEEWHY-FOUNDING-097', 'bronze', true, 97),
  ('SEEWHY-FOUNDING-098', 'bronze', true, 98),
  ('SEEWHY-FOUNDING-099', 'bronze', true, 99),
  ('SEEWHY-FOUNDING-100', 'bronze', true, 100)
on conflict (code) do nothing;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 9. FALLEN LEGENDS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
create table if not exists public.fallen_legends (
  id                  bigserial primary key,
  name                text not null,
  bio                 text,
  memorial_date       date,
  image_url           text,
  tribute_stream_id   text,
  added_by            uuid references public.profiles(id) on delete set null,
  created_at          timestamptz default now()
);

alter table public.fallen_legends enable row level security;

create policy "fallen_legends_select_all" on fallen_legends for select using (true);
create policy "fallen_legends_insert_mods" on fallen_legends for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('host','mod','admin'))
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 10. TOURNAMENTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
create table if not exists public.tournaments (
  id            text primary key,
  name          text not null,
  format        text default 'single_elimination' check (format in ('single_elimination','round_robin','double_elimination')),
  host_id       uuid references public.profiles(id) on delete set null,
  participants  jsonb default '[]',
  bracket       jsonb default '[]',
  status        text default 'pending' check (status in ('pending','active','completed','cancelled')),
  winner_id     uuid,
  created_at    timestamptz default now(),
  started_at    timestamptz,
  ended_at      timestamptz
);

alter table public.tournaments enable row level security;

create policy "tournaments_select_all"   on tournaments for select using (true);
create policy "tournaments_manage_host"  on tournaments for all using (auth.uid() = host_id);
create policy "tournaments_insert_hosts" on tournaments for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('host','admin'))
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 11. WATCH PARTIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
create table if not exists public.watch_parties (
  id          text primary key,
  host_id     uuid references public.profiles(id) on delete cascade,
  video_url   text not null,
  title       text,
  is_active   boolean default true,
  member_count integer default 1,
  created_at  timestamptz default now()
);

alter table public.watch_parties enable row level security;

create policy "watch_parties_select_all"  on watch_parties for select using (true);
create policy "watch_parties_manage_host" on watch_parties for all using (auth.uid() = host_id);
create policy "watch_parties_insert_all"  on watch_parties for insert with check (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 12. PK BATTLES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
create table if not exists public.pk_battles (
  id          text primary key default gen_random_uuid()::text,
  room_a      text not null,
  room_b      text not null,
  host_a_id   uuid references public.profiles(id),
  host_b_id   uuid references public.profiles(id),
  score_a     integer default 0,
  score_b     integer default 0,
  winner_room text,
  status      text default 'active' check (status in ('active','ended','cancelled')),
  started_at  timestamptz default now(),
  ended_at    timestamptz,
  duration_ms integer default 300000
);

alter table public.pk_battles enable row level security;

create policy "pk_battles_select_all"  on pk_battles for select using (true);
create policy "pk_battles_insert_all"  on pk_battles for insert with check (true);
create policy "pk_battles_update_all"  on pk_battles for update using (true);

alter publication supabase_realtime add table pk_battles;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 13. CLIPS / VODs
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
create table if not exists public.clips (
  id            text primary key default gen_random_uuid()::text,
  creator_id    uuid references public.profiles(id) on delete cascade,
  stream_id     text,
  title         text not null,
  description   text,
  video_url     text not null,
  thumbnail_url text,
  duration_sec  integer,
  view_count    integer default 0,
  is_public     boolean default true,
  tags          text[] default '{}',
  created_at    timestamptz default now()
);

alter table public.clips enable row level security;

create policy "clips_select_public"   on clips for select using (is_public = true or auth.uid() = creator_id);
create policy "clips_manage_creator"  on clips for all using (auth.uid() = creator_id);
create policy "clips_insert_creator"  on clips for insert with check (auth.uid() = creator_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 14. FOLLOWS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  creator_id  uuid references public.profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (follower_id, creator_id)
);

alter table public.follows enable row level security;

create policy "follows_select_all"    on follows for select using (true);
create policy "follows_manage_own"    on follows for all using (auth.uid() = follower_id);
create policy "follows_insert_own"    on follows for insert with check (auth.uid() = follower_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SEED DATA
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Washington Classic 2026 stream
insert into public.streams (id, creator_username, title, category, is_live, paywall_enabled, paywall_tier)
values ('wc2026finals', 'SwanyThree23', 'Washington Classic 2026 — Championship Finals', 'domino', false, true, 'silver')
on conflict (id) do nothing;

-- AIverse Podcast stream
insert into public.streams (id, creator_username, title, category, is_live)
values ('aiverse-live', 'SwanyThree23', 'AIverse Podcast — Live Edition', 'podcast', false)
on conflict (id) do nothing;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- INDEXES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
create index if not exists streams_creator_idx       on streams(creator_id);
create index if not exists streams_is_live_idx       on streams(is_live);
create index if not exists chat_stream_idx           on stream_chat(stream_id, created_at desc);
create index if not exists tribute_recipient_idx     on tribute_transactions(recipient_id, created_at desc);
create index if not exists tribute_sender_idx        on tribute_transactions(sender_id);
create index if not exists tribute_stream_idx        on tribute_transactions(stream_id);
create index if not exists tribute_paid_out_idx      on tribute_transactions(recipient_id, paid_out);
create index if not exists clips_creator_idx         on clips(creator_id, created_at desc);
create index if not exists follows_creator_idx       on follows(creator_id);
create index if not exists moderation_user_idx       on moderation_actions(user_id);
create index if not exists moderation_stream_idx     on moderation_actions(stream_id);
