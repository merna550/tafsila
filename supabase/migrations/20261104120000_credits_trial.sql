-- M7 credits read model and the free trial (issue #370, ADR-365 items 2-4 and 6, ADR-370).
-- One function holds the expiry math (credit_lots); the balance and the summary read it. The trial is granted in SQL, once.

-- Unexpired lots with credits left: grant minus what debits drew from it.
create function private.credit_lots(p_user uuid)
returns table (id uuid, remaining integer, expires_at timestamptz, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id, (g.delta - coalesce(d.used, 0))::integer, g.expires_at, g.created_at
  from public.credit_ledger g
  left join lateral (
    select sum(-x.delta) as used from public.credit_ledger x where x.lot_id = g.id
  ) d on true
  where g.user_id = p_user and g.delta > 0 and (g.expires_at is null or g.expires_at > now())
    and g.delta - coalesce(d.used, 0) > 0;
$$;

-- Balance: remaining credits of the unexpired lots (same result as before, now built on credit_lots).
create or replace function private.credit_balance(p_user uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(l.remaining), 0)::integer from private.credit_lots(p_user) l;
$$;

-- The active plan of a user (status active and period not over), or no row. A lapsed plan needs no cron.
create function private.plan_limits(p_user uuid)
returns table (max_clients integer, chat_per_design integer)
language sql
stable
security definer
set search_path = ''
as $$
  select pr.max_clients, pr.chat_per_design
  from public.subscriptions s
  join public.products pr on pr.code = s.product_code
  where s.user_id = p_user and s.status = 'active' and s.current_period_end > now();
$$;

-- Everything GET /api/me/credits needs in one read: balance, lots with credits left and the active plan (or null).
create function private.credit_summary(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'balance', private.credit_balance(p_user),
    'lots', coalesce(
      (select jsonb_agg(jsonb_build_object('remaining', l.remaining, 'expires_at', l.expires_at)
                        order by l.expires_at nulls last, l.created_at, l.id)
       from private.credit_lots(p_user) l),
      '[]'::jsonb),
    'plan', (
      select jsonb_build_object(
        'code', pr.code, 'period_end', s.current_period_end,
        'max_clients', pr.max_clients, 'chat_per_design', pr.chat_per_design)
      from public.subscriptions s
      join public.products pr on pr.code = s.product_code
      where s.user_id = p_user and s.status = 'active' and s.current_period_end > now())
  );
$$;

-- Grants the free trial once. The row lock on the user's trial_phones row and trial_granted_at make a second call do
-- nothing; one hash row per number keeps it once per phone. Returns true only when credits were granted now.
create function private.grant_trial(p_user uuid, p_credits integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.trial_phones t where t.user_id = p_user for update;
  if not private.is_trial_eligible(p_user) then
    return false;
  end if;
  perform private.grant_credits(p_user, p_credits, 'trial', null, null);
  update public.trial_phones set trial_granted_at = now() where user_id = p_user;
  return true;
end;
$$;

revoke all on function private.credit_lots(uuid) from public;
revoke all on function private.plan_limits(uuid) from public;
revoke all on function private.credit_summary(uuid) from public;
revoke all on function private.grant_trial(uuid, integer) from public;
grant execute on function private.credit_lots(uuid) to api_app, service_role;
grant execute on function private.plan_limits(uuid) to api_app, service_role;
grant execute on function private.credit_summary(uuid) to api_app, service_role;
grant execute on function private.grant_trial(uuid, integer) to api_app, service_role;
