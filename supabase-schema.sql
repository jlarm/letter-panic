-- Run this in Supabase → SQL Editor

-- 1. Profiles (one row per user, stores their chosen username)
create table if not exists profiles (
  id   uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz default now()
);

-- 2. Game results (one row per player per day)
create table if not exists game_results (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  played_date  date not null,
  word         text not null,
  won          boolean not null,
  guesses_used integer not null,
  guess_words  text[] not null,
  completed_at timestamptz default now(),
  unique (user_id, played_date)
);

-- 3. Row-level security
alter table profiles     enable row level security;
alter table game_results enable row level security;

create policy "profiles: public read"     on profiles     for select using (true);
create policy "profiles: own insert"      on profiles     for insert with check (auth.uid() = id);
create policy "profiles: own update"      on profiles     for update using (auth.uid() = id);

create policy "results: public read"      on game_results for select using (true);
create policy "results: own insert"       on game_results for insert with check (auth.uid() = user_id);

-- 4. Leaderboard function (called via supabase.rpc('get_leaderboard'))
create or replace function get_leaderboard()
returns table (
  username text,
  wins     bigint,
  played   bigint,
  win_pct  numeric
)
language sql
security definer
as $$
  select
    p.username,
    count(*) filter (where gr.won)                                           as wins,
    count(*)                                                                  as played,
    round(count(*) filter (where gr.won)::numeric / nullif(count(*),0) * 100) as win_pct
  from profiles p
  inner join game_results gr on gr.user_id = p.id
  group by p.id, p.username
  order by wins desc, win_pct desc
  limit 50;
$$;
