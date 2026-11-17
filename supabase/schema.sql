-- Run in the Supabase SQL Editor ONCE.
-- The application sends requests from server-side Next.js routes only.
create table if not exists public.daily_counters (
  challenge_date date primary key,
  attempts integer not null default 0 check (attempts >= 0)
);

create table if not exists public.daily_attempts (
  id uuid primary key default gen_random_uuid(),
  challenge_date date not null,
  attempt_number integer not null check (attempt_number > 0),
  player_name varchar(24) not null,
  guesses jsonb not null,
  total_distance integer not null check (total_distance between 0 and 1610),
  created_at timestamptz not null default now(),
  unique (challenge_date, attempt_number)
);
create index if not exists daily_attempts_rank_idx
  on public.daily_attempts (challenge_date, total_distance desc, created_at asc);

alter table public.daily_attempts enable row level security;
alter table public.daily_counters enable row level security;
revoke all on public.daily_attempts from anon, authenticated;
revoke all on public.daily_counters from anon, authenticated;

create or replace function public.submit_daily_attempt(
  p_day date,
  p_name text,
  p_guesses jsonb,
  p_total integer
)
returns setof public.daily_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  next_number integer;
begin
  if length(trim(p_name)) < 2 or length(trim(p_name)) > 24 then
    raise exception 'Invalid player name';
  end if;
  if p_day <> (now() at time zone 'utc')::date then
    raise exception 'Challenge has reset';
  end if;
  if jsonb_typeof(p_guesses) <> 'array' or jsonb_array_length(p_guesses) <> 7 then
    raise exception 'Invalid guesses';
  end if;
  if p_total < 0 or p_total > 1610 then
    raise exception 'Invalid score';
  end if;
  insert into public.daily_counters (challenge_date, attempts)
  values (p_day, 1)
  on conflict (challenge_date)
  do update set attempts = public.daily_counters.attempts + 1
  returning attempts into next_number;

  return query insert into public.daily_attempts (challenge_date, attempt_number, player_name, guesses, total_distance)
  values (p_day, next_number, trim(p_name), p_guesses, p_total)
  returning *;
end;
$$;

revoke all on function public.submit_daily_attempt(date, text, jsonb, integer) from public, anon, authenticated;
grant execute on function public.submit_daily_attempt(date, text, jsonb, integer) to service_role;
