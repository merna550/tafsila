-- pgTAP tests for issue #367: billing tables, RLS, grants and the private writer functions. Run: pnpm db:test
-- Note: a true two-session race on consume_credit cannot be run in pgTAP (one session); the profiles row lock is the
-- guard and the serial order (second call refused) is what is asserted here.
begin;
select plan(26);

insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a@t.test', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b@t.test', 'authenticated', 'authenticated'),
  ('cccccccc-0000-4000-8000-000000000003', 'c@t.test', 'authenticated', 'authenticated');
update public.profiles set role = 'admin' where id = 'cccccccc-0000-4000-8000-000000000003';

-- Fixtures written the way the API would: through the private functions.
select private.grant_credits('aaaaaaaa-0000-4000-8000-000000000001', 3, 'trial', null, null);
select private.grant_credits('bbbbbbbb-0000-4000-8000-000000000002', 2, 'trial', null, null);
insert into public.payments (id, user_id, product_code, amount_piastres, method) values
  ('a0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'single', 4900, 'fake'),
  ('b0000000-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', 'single', 4900, 'fake');
insert into public.subscriptions (user_id, product_code, status, current_period_end) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'hobby', 'active', now() + interval '30 days');

create function pg_temp.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;
create function pg_temp.reset() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', true);
end $$;
grant execute on function pg_temp.act_as(uuid), pg_temp.reset() to public;

-- Products
select is((select count(*)::int from public.products), 4, '1 four products seeded');
select is((select price_piastres from public.products where code = 'pack5'), 19900, '2 prices are in piastres');
select is((select max_clients from public.products where code = 'pro'), null, '3 pro has unlimited clients');

-- RLS reads
select pg_temp.act_as('aaaaaaaa-0000-4000-8000-000000000001');
select is((select count(*)::int from public.credit_ledger), 1, '4 A reads only A ledger');
select is((select count(*)::int from public.payments), 1, '5 A reads only A payments');
select is((select count(*)::int from public.subscriptions), 1, '6 A reads A subscription');
select is((select count(*)::int from public.products), 4, '7 signed-in user reads products');
select pg_temp.reset();
select pg_temp.act_as('bbbbbbbb-0000-4000-8000-000000000002');
select is((select count(*)::int from public.subscriptions), 0, '8 B sees no subscription of A');
select pg_temp.reset();
select pg_temp.act_as('cccccccc-0000-4000-8000-000000000003');
select ok((select count(*)::int from public.credit_ledger) >= 2, '9 admin reads all ledger rows');
select ok((select count(*)::int from public.payments) >= 2, '10 admin reads all payments');
select pg_temp.reset();

-- No writes for authenticated or anon
select pg_temp.act_as('aaaaaaaa-0000-4000-8000-000000000001');
select throws_ok($$insert into public.credit_ledger (user_id, delta, reason) values ('aaaaaaaa-0000-4000-8000-000000000001', 5, 'admin')$$, '42501', null, '11 A cannot insert into the ledger');
select throws_ok($$update public.payments set status = 'paid'$$, '42501', null, '12 A cannot update payments');
select throws_ok($$delete from public.subscriptions$$, '42501', null, '13 A cannot delete subscriptions');
select throws_ok($$update public.products set price_piastres = 1$$, '42501', null, '14 A cannot change products');
select throws_ok($$select private.consume_credit('aaaaaaaa-0000-4000-8000-000000000001', gen_random_uuid())$$, '42501', null, '15 A cannot call the private writers');
select pg_temp.reset();
select is(has_table_privilege('api_app', 'public.credit_ledger', 'select') or has_table_privilege('api_app', 'public.payments', 'select'), false, '16 api_app has no table access without set role');

-- Balance and FIFO: A has the 3-credit trial lot (no expiry) and gets a pack of 2 that expires in 10 days, plus an expired lot.
insert into public.credit_ledger (user_id, delta, reason, ref_id, expires_at, created_at) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 4, 'purchase', 'old-payment', now() - interval '1 day', now() - interval '40 days');
select private.grant_credits('aaaaaaaa-0000-4000-8000-000000000001', 2, 'purchase', 'pay-1', now() + interval '10 days');
select is(private.credit_balance('aaaaaaaa-0000-4000-8000-000000000001'), 5, '17 balance ignores the expired lot');
select private.consume_credit('aaaaaaaa-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001');
select is(
  (select g.reason from public.credit_ledger d join public.credit_ledger g on g.id = d.lot_id where d.ref_id = 'd0000000-0000-4000-8000-000000000001'),
  'purchase', '18 the debit draws from the lot that expires first');
select is(private.consume_credit('aaaaaaaa-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001'),
  (select id from public.credit_ledger where ref_id = 'd0000000-0000-4000-8000-000000000001'), '19 same design again returns the same debit');
select is((select count(*)::int from public.credit_ledger where reason = 'pattern' and user_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 1, '20 one debit only for that design');
select is(private.grant_credits('aaaaaaaa-0000-4000-8000-000000000001', 2, 'purchase', 'pay-1', now() + interval '10 days'),
  (select id from public.credit_ledger where ref_id = 'pay-1'), '21 same payment granted once');

-- Running out: B has 2 credits.
select private.consume_credit('bbbbbbbb-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002');
select private.consume_credit('bbbbbbbb-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000003');
select throws_ok($$select private.consume_credit('bbbbbbbb-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000004')$$,
  'P0001', 'INSUFFICIENT_CREDITS', '22 a third debit on balance 0 is refused');
select is(private.credit_balance('bbbbbbbb-0000-4000-8000-000000000002'), 0, '23 balance is 0');

-- Payments
select is((select changed from private.record_payment('a0000000-0000-4000-8000-000000000001', 'tx-1', 'paid', '{}', now())), true, '24 first record changes the row');
select is((select changed from private.record_payment('a0000000-0000-4000-8000-000000000001', 'tx-1', 'paid', '{}', now())), false, '25 same transaction again changes nothing');
select throws_ok($$select * from private.record_payment('b0000000-0000-4000-8000-000000000002', 'tx-1', 'paid', '{}', now())$$,
  '23505', null, '26 another payment cannot reuse the transaction id');

select * from finish();
rollback;
