-- ============================================================
-- supabase/schema.sql
-- Run this in the Supabase SQL editor to set up your database.
-- ============================================================

-- ----------------------------------------------------------------
-- 1. MEALS
-- ----------------------------------------------------------------
create table if not exists meals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  calories    integer not null check (calories >= 0),
  notes       text,
  created_at  timestamptz not null default now()
);

-- Index for fast per-user, per-day queries
create index if not exists meals_user_date on meals (user_id, created_at);

-- Row-Level Security
alter table meals enable row level security;

create policy "Users can view their own meals"
  on meals for select using (auth.uid() = user_id);

create policy "Users can insert their own meals"
  on meals for insert with check (auth.uid() = user_id);

create policy "Users can update their own meals"
  on meals for update using (auth.uid() = user_id);

create policy "Users can delete their own meals"
  on meals for delete using (auth.uid() = user_id);


-- ----------------------------------------------------------------
-- 2. ADJUSTMENTS (extra calories – oils, sauces, etc.)
-- ----------------------------------------------------------------
create table if not exists adjustments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  calories    integer not null check (calories >= 0),
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists adjustments_user_date on adjustments (user_id, created_at);

alter table adjustments enable row level security;

create policy "Users can view their own adjustments"
  on adjustments for select using (auth.uid() = user_id);

create policy "Users can insert their own adjustments"
  on adjustments for insert with check (auth.uid() = user_id);

create policy "Users can update their own adjustments"
  on adjustments for update using (auth.uid() = user_id);

create policy "Users can delete their own adjustments"
  on adjustments for delete using (auth.uid() = user_id);


-- ----------------------------------------------------------------
-- 3. DAILY_STATS (calories burned per day)
-- ----------------------------------------------------------------
create table if not exists daily_stats (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  date            date not null,
  calories_burned integer not null default 0 check (calories_burned >= 0),
  -- One row per user per day
  unique (user_id, date)
);

alter table daily_stats enable row level security;

create policy "Users can view their own daily stats"
  on daily_stats for select using (auth.uid() = user_id);

create policy "Users can insert their own daily stats"
  on daily_stats for insert with check (auth.uid() = user_id);

create policy "Users can update their own daily stats"
  on daily_stats for update using (auth.uid() = user_id);

create policy "Users can delete their own daily stats"
  on daily_stats for delete using (auth.uid() = user_id);
