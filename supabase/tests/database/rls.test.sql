-- pgTAP tests for issue #24: RLS, grants, sign-up trigger, cascade. Run: pnpm db:test
begin;
select plan(31);

-- Fixtures (as the superuser). A and B are ordinary users, C is an admin.
insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a@t.test', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b@t.test', 'authenticated', 'authenticated'),
  ('cccccccc-0000-4000-8000-000000000003', 'c@t.test', 'authenticated', 'authenticated');
update public.profiles set role = 'admin' where id = 'cccccccc-0000-4000-8000-000000000003';
insert into public.clients (id, owner_id, name) values
  ('aaaaaaaa-0000-4000-8000-0000000000a1', 'aaaaaaaa-0000-4000-8000-000000000001', 'A client'),
  ('bbbbbbbb-0000-4000-8000-0000000000b1', 'bbbbbbbb-0000-4000-8000-000000000002', 'B client');
insert into public.size_charts (id, name, sizes) values
  ('11111111-0000-4000-8000-000000000001', 'system chart', '{}');
insert into public.size_charts (id, name, sizes, owner_id) values
  ('22222222-0000-4000-8000-000000000002', 'A private chart', '{}', 'aaaaaaaa-0000-4000-8000-000000000001');
insert into public.admin_audit (who, action) values ('cccccccc-0000-4000-8000-000000000003', 'seed');

-- Acts as a signed-in user: the same role and claim the API sets inside withUser.
create function pg_temp.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;
-- Back to the superuser with no claims.
create function pg_temp.reset() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', true);
end $$;
grant execute on function pg_temp.act_as(uuid), pg_temp.reset() to public;

-- 1-5 clients and measurement sets
select pg_temp.act_as('bbbbbbbb-0000-4000-8000-000000000002');
select is((select count(*)::int from public.clients where name = 'A client'), 0, '1 B cannot read A client');
update public.clients set name = 'hacked' where id = 'aaaaaaaa-0000-4000-8000-0000000000a1';
delete from public.clients where id = 'aaaaaaaa-0000-4000-8000-0000000000a1';
select pg_temp.reset();
select is((select name from public.clients where id = 'aaaaaaaa-0000-4000-8000-0000000000a1'), 'A client', '2 B cannot update or delete A client');

select pg_temp.act_as('aaaaaaaa-0000-4000-8000-000000000001');
select throws_ok(
  $$ insert into public.clients (owner_id, name) values ('bbbbbbbb-0000-4000-8000-000000000002', 'x') $$,
  '42501', null, '3 A cannot create a client owned by B');
select throws_ok(
  $$ insert into public.measurement_sets (client_id, label, data)
     values ('bbbbbbbb-0000-4000-8000-0000000000b1', 'x', '{}') $$,
  '23503', null, '4 A cannot attach a set to B client');
select lives_ok(
  $$ insert into public.measurement_sets (client_id, label, data)
     values ('aaaaaaaa-0000-4000-8000-0000000000a1', 'ok', '{}') $$,
  '5 A can attach a set to own client');

-- 6-9 profiles
select throws_ok($$ update public.profiles set role = 'admin' where id = auth.uid() $$,
  '42501', null, '6 A cannot make self admin');
select throws_ok($$ update public.profiles set phone_verified_at = now() where id = auth.uid() $$,
  '42501', null, '7 A cannot verify own phone');
select lives_ok($$ update public.profiles set name = 'New', locale = 'en' where id = auth.uid() $$,
  '8 A can change name and locale');
select throws_ok($$ update public.profiles set locale = 'fr' where id = auth.uid() $$,
  '23514', null, '9 invalid locale rejected');

-- 10-16 size charts
select pg_temp.reset();
set local role anon;
select is((select count(*)::int from public.size_charts where name = 'system chart'), 1, '10 anon reads system charts');
select is((select count(*)::int from public.size_charts where name = 'A private chart'), 0, '10b anon cannot read private charts');
select throws_ok($$ select * from public.clients $$, '42501', null, '11 anon has no access to clients');

select pg_temp.act_as('aaaaaaaa-0000-4000-8000-000000000001');
select throws_ok($$ insert into public.size_charts (name, sizes) values ('x', '{}') $$,
  '42501', null, '12 normal user cannot create a system chart');
update public.size_charts set name = 'hacked' where id = '11111111-0000-4000-8000-000000000001';
select lives_ok($$ insert into public.size_charts (name, sizes, owner_id)
  values ('mine', '{}', auth.uid()) $$, '15 user creates own private chart');
select pg_temp.reset();
select is((select name from public.size_charts where id = '11111111-0000-4000-8000-000000000001'), 'system chart', '13 normal user cannot update a system chart');

select pg_temp.act_as('cccccccc-0000-4000-8000-000000000003');
select lives_ok($$ insert into public.size_charts (name, sizes) values ('admin chart', '{}') $$, '14 admin creates a system chart');

select pg_temp.act_as('bbbbbbbb-0000-4000-8000-000000000002');
select is((select count(*)::int from public.size_charts where owner_id is not null), 0, '16 B cannot read A private chart');

-- 17-21 admin_audit
select is((select count(*)::int from public.admin_audit), 0, '17 normal user cannot read the audit log');
select throws_ok($$ insert into public.admin_audit (who, action) values (auth.uid(), 'x') $$,
  '42501', null, '21 normal user cannot write the audit log');
select pg_temp.act_as('cccccccc-0000-4000-8000-000000000003');
select lives_ok($$ insert into public.admin_audit (who, action) values (auth.uid(), 'edit chart') $$, '18 admin appends to the audit log');
select throws_ok($$ update public.admin_audit set action = 'x' $$, '42501', null, '19 audit log cannot be updated');
select throws_ok($$ delete from public.admin_audit $$, '42501', null, '20 audit log cannot be deleted');

-- 22 sign-up trigger
select pg_temp.reset();
insert into auth.users (id, email, aud, role) values ('dddddddd-0000-4000-8000-000000000004', 'd@t.test', 'authenticated', 'authenticated');
select is((select role || '/' || locale from public.profiles where id = 'dddddddd-0000-4000-8000-000000000004'), 'user/ar', '22 sign-up creates a profile with defaults');

-- 28 API login role has no table access of its own
set local role api_app;
select throws_ok($$ select * from public.clients $$, '42501', null, '28 api_app alone cannot read clients');
select pg_temp.reset();

-- 29-30 phone uniqueness
update public.profiles set phone = '+201111111111' where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select throws_ok($$ update public.profiles set phone = '+201111111111' where id = 'bbbbbbbb-0000-4000-8000-000000000002' $$,
  '23505', null, '29 duplicate phone rejected');
select cmp_ok((select count(*)::int from public.profiles where phone is null), '>=', 2, '30 many profiles may have no phone');

-- 23-27 account deletion cascades (A), audit rows survive (C)
delete from auth.users where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is((select count(*)::int from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000001'), 0, '23 profile removed');
select is((select count(*)::int from public.clients where owner_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 0, '24 clients removed');
select is((select count(*)::int from public.measurement_sets where owner_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 0, '25 measurement sets removed');
select is((select count(*)::int from public.size_charts where owner_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 0, '26 private charts removed');
delete from auth.users where id = 'cccccccc-0000-4000-8000-000000000003';
select is((select count(*)::int from public.admin_audit where action = 'edit chart' and who is null), 1, '27 audit row kept with who = null');

select * from finish();
rollback;
