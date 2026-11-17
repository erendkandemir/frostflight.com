-- Apply once in Supabase SQL Editor for an EXISTING Frost Flight leaderboard.
-- Keeps the global attempt_number and adds a separate browser-specific number.
-- Old entries cannot be assigned to browsers retroactively and remain NULL.

alter table public.daily_attempts
  add column if not exists device_id uuid,
  add column if not exists player_attempt_number integer;

create table if not exists public.daily_device_counters (
  challenge_date date not null,
  device_id uuid not null,
  attempts integer not null default 0 check (attempts >= 0),
  primary key (challenge_date, device_id)
);

create unique index if not exists daily_attempts_personal_num_idx
  on public.daily_attempts (challenge_date, device_id, player_attempt_number)
  where device_id is not null and player_attempt_number is not null;

alter table public.daily_device_counters enable row level security;
revoke all on public.daily_device_counters from anon, authenticated;

create or replace function public.submit_daily_attempt(
  p_day date,
  p_name text,
  p_guesses jsonb,
  p_total integer,
  p_device_id uuid
)
returns setof public.daily_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  next_global integer;
  next_personal integer;
begin
  if p_device_id is null then
    raise exception 'Missing browser identifier';
  end if;
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
  returning attempts into next_global;

  insert into public.daily_device_counters (challenge_date, device_id, attempts)
  values (p_day, p_device_id, 1)
  on conflict (challenge_date, device_id)
  do update set attempts = public.daily_device_counters.attempts + 1
  returning attempts into next_personal;

  return query insert into public.daily_attempts
    (challenge_date, attempt_number, player_attempt_number, device_id, player_name, guesses, total_distance)
  values
    (p_day, next_global, next_personal, p_device_id, trim(p_name), p_guesses, p_total)
  returning *;
end;
$$;

-- Retire the old four-argument function; new code calls the five-argument one.
drop function if exists public.submit_daily_attempt(date, text, jsonb, integer);
revoke all on function public.submit_daily_attempt(date, text, jsonb, integer, uuid) from public, anon, authenticated;
grant execute on function public.submit_daily_attempt(date, text, jsonb, integer, uuid) to service_role;
