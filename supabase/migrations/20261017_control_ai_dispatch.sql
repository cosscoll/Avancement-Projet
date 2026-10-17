-- CONTROL Cloud only. DO NOT apply this to the existing IAgile Academy project.
-- Private atomic daily AI invocation cap. Calls to this function require the
-- Supabase service role and an explicit server-side dispatch allowlist.
create table if not exists public.control_ai_daily_usage (
  owner_id uuid not null references auth.users(id) on delete cascade,
  day_utc date not null default (now() at time zone 'utc')::date,
  provider text not null check (provider in ('Claude','Gemini')),
  attempts integer not null default 0 check (attempts between 0 and 1000),
  primary key(owner_id,day_utc,provider)
);
alter table public.control_ai_daily_usage enable row level security;
revoke all on public.control_ai_daily_usage from anon,authenticated;

create or replace function public.control_claim_ai_quota(p_owner uuid,p_provider text,p_cap integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare n integer;
begin
  if p_owner is null or p_provider not in ('Claude','Gemini') or p_cap is null or p_cap < 1 or p_cap > 10 then
    return false;
  end if;
  insert into public.control_ai_daily_usage as usage(owner_id,day_utc,provider,attempts)
  values(p_owner,(now() at time zone 'utc')::date,p_provider,1)
  on conflict(owner_id,day_utc,provider)
  do update set attempts=usage.attempts+1
    where usage.attempts < p_cap
  returning attempts into n;
  return n is not null;
end;
$$;
revoke all on function public.control_claim_ai_quota(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.control_claim_ai_quota(uuid,text,integer) to service_role;
