-- M7 billing (issue #367, ADR-365 items 2, 3, 5, 6, 9): products, credit ledger, subscriptions, payments.
-- Rule (ADR-035, ADR-26a 8, ADR-32a 2): users and admins only READ these tables (RLS). Every write goes through a `private`
-- security-definer function that only the api_app role (and service_role) can execute. The balance is computed from the ledger.

-- Products: prices live in the database, never in code (FR-BILL-03). Prices are in piastres.
create table public.products (
  code text primary key check (code ~ '^[a-z0-9_]+$'),
  kind text not null check (kind in ('single', 'pack', 'subscription')),
  price_piastres integer not null check (price_piastres > 0),
  credits integer not null check (credits > 0),
  -- Days a bought credit lasts; null = never expires.
  credit_days integer check (credit_days > 0),
  -- Subscriptions only: length of one period in days.
  period_days integer check (period_days > 0),
  -- Plan limits (ADR-365 item 6): null max_clients = unlimited.
  max_clients integer check (max_clients > 0),
  chat_per_design integer not null check (chat_per_design > 0),
  active boolean not null default true,
  name_ar text not null,
  name_en text not null,
  check ((kind = 'subscription') = (period_days is not null))
);
comment on table public.products is 'What can be bought. Readable by everyone (active rows); written only by admin functions (#373).';
insert into public.products (code, kind, price_piastres, credits, credit_days, period_days, max_clients, chat_per_design, name_ar, name_en) values
  ('single', 'single', 4900, 1, null, null, 10, 10, 'تصميم واحد', 'Single pattern'),
  ('pack5', 'pack', 19900, 5, 90, null, 10, 10, 'باقة ٥ تصميمات', '5-pack'),
  ('hobby', 'subscription', 14900, 8, null, 30, 10, 10, 'هواية شهرياً', 'Hobby monthly'),
  ('pro', 'subscription', 34900, 30, null, 30, null, 20, 'محترف شهرياً', 'Pro monthly');

-- Credit ledger: grants (delta > 0) and debits (delta < 0). A debit points at the grant (lot) it draws from, so a lot's
-- expiry needs no cron: balance = sum over unexpired lots of (grant - debited from it).
create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null check (delta <> 0),
  reason text not null check (reason in ('trial', 'purchase', 'subscription', 'pattern', 'admin', 'refund')),
  -- Payment id, design id or audit id; used for idempotency.
  ref_id text,
  -- Grants only; null = never expires.
  expires_at timestamptz,
  -- Debits only: the grant it draws from.
  lot_id uuid references public.credit_ledger (id),
  created_at timestamptz not null default now(),
  check (delta > 0 and lot_id is null or delta < 0 and lot_id is not null and expires_at is null)
);
comment on table public.credit_ledger is 'Append-only credit grants and debits. Written only by private.grant_credits / private.consume_credit.';
create index credit_ledger_user_expires_idx on public.credit_ledger (user_id, expires_at);
create index credit_ledger_lot_idx on public.credit_ledger (lot_id);
-- A design is charged once and a payment granted once.
create unique index credit_ledger_once_idx on public.credit_ledger (reason, ref_id)
  where reason in ('pattern', 'purchase', 'subscription') and ref_id is not null;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_code text not null references public.products (code),
  status text not null check (status in ('active', 'expired', 'cancelled')),
  current_period_end timestamptz not null,
  created_at timestamptz not null default now()
);
comment on table public.subscriptions is 'A user''s plan. At most one active row per user. Written by the fulfilment function (#376).';
create unique index subscriptions_one_active_idx on public.subscriptions (user_id) where status = 'active';

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_code text not null references public.products (code),
  amount_piastres integer not null check (amount_piastres > 0),
  currency text not null default 'EGP' check (currency = 'EGP'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  method text not null check (method in ('card', 'wallet', 'kiosk', 'fake')),
  paymob_order_id text unique,
  paymob_transaction_id text unique,
  -- The parsed event only, never the raw request body.
  raw jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
comment on table public.payments is 'One row per checkout. Status changes only through private.record_payment.';
create index payments_user_id_idx on public.payments (user_id);

-- RLS: owner or admin may read; nobody gets a write grant.
alter table public.products enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
revoke all on public.products, public.credit_ledger, public.subscriptions, public.payments from anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.credit_ledger, public.subscriptions, public.payments to authenticated;

create policy products_read on public.products
  for select to anon, authenticated using (active or public.is_admin());
create policy credit_ledger_read on public.credit_ledger
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy subscriptions_read on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy payments_read on public.payments
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

-- Balance: remaining credits of the unexpired lots.
create function private.credit_balance(p_user uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(greatest(g.delta - coalesce(d.used, 0), 0)), 0)::integer
  from public.credit_ledger g
  left join lateral (
    select sum(-x.delta) as used from public.credit_ledger x where x.lot_id = g.id
  ) d on true
  where g.user_id = p_user and g.delta > 0 and (g.expires_at is null or g.expires_at > now());
$$;

-- Grant credits. Idempotent on (reason, ref_id) for purchase / subscription: a second call returns the existing row id.
create function private.grant_credits(
  p_user uuid, p_delta integer, p_reason text, p_ref text, p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_delta is null or p_delta <= 0 then
    raise exception 'grant must be positive' using errcode = '22023';
  end if;
  insert into public.credit_ledger (user_id, delta, reason, ref_id, expires_at)
  values (p_user, p_delta, p_reason, p_ref, p_expires_at)
  on conflict (reason, ref_id) where reason in ('pattern', 'purchase', 'subscription') and ref_id is not null
  do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.credit_ledger where reason = p_reason and ref_id = p_ref;
  end if;
  return v_id;
end;
$$;

-- Use one credit for a design. Locks the user's profile row so two saves queue up; takes the lot that expires first
-- (never-expiring lots last). Calling again for the same design returns the existing debit (no double charge).
create function private.consume_credit(p_user uuid, p_design uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lot uuid;
  v_id uuid;
begin
  perform 1 from public.profiles where id = p_user for update;
  select id into v_id from public.credit_ledger where reason = 'pattern' and ref_id = p_design::text;
  if v_id is not null then
    return v_id;
  end if;
  select g.id into v_lot
  from public.credit_ledger g
  where g.user_id = p_user and g.delta > 0 and (g.expires_at is null or g.expires_at > now())
    and g.delta - coalesce((select sum(-x.delta) from public.credit_ledger x where x.lot_id = g.id), 0) > 0
  order by g.expires_at nulls last, g.created_at, g.id
  limit 1;
  if v_lot is null then
    raise exception 'INSUFFICIENT_CREDITS' using errcode = 'P0001';
  end if;
  insert into public.credit_ledger (user_id, delta, reason, ref_id, lot_id)
  values (p_user, -1, 'pattern', p_design::text, v_lot)
  returning id into v_id;
  return v_id;
end;
$$;

-- Record a payment result once: only a pending row changes; the same transaction id again changes nothing.
create function private.record_payment(
  p_payment uuid, p_transaction_id text, p_status text, p_raw jsonb, p_paid_at timestamptz
)
returns table (changed boolean, status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if p_status not in ('paid', 'failed') then
    raise exception 'status must be paid or failed' using errcode = '22023';
  end if;
  update public.payments p
  set status = p_status, paymob_transaction_id = p_transaction_id, raw = p_raw,
      paid_at = case when p_status = 'paid' then p_paid_at end
  where p.id = p_payment and p.status = 'pending'
  returning p.status into v_status;
  if found then
    return query select true, v_status;
  else
    return query select false, (select p.status from public.payments p where p.id = p_payment);
  end if;
end;
$$;

revoke all on function private.credit_balance(uuid) from public;
revoke all on function private.grant_credits(uuid, integer, text, text, timestamptz) from public;
revoke all on function private.consume_credit(uuid, uuid) from public;
revoke all on function private.record_payment(uuid, text, text, jsonb, timestamptz) from public;
grant execute on function private.credit_balance(uuid) to api_app, service_role;
grant execute on function private.grant_credits(uuid, integer, text, text, timestamptz) to api_app, service_role;
grant execute on function private.consume_credit(uuid, uuid) to api_app, service_role;
grant execute on function private.record_payment(uuid, text, text, jsonb, timestamptz) to api_app, service_role;
