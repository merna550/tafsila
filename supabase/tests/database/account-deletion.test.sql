-- pgTAP tests for issue #27 part A: private.record_account_deleted and what deleting an auth user removes. Run: pnpm db:test
begin;
select plan(14);

insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000a27', 'da@t.test', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000b27', 'db@t.test', 'authenticated', 'authenticated');

insert into public.clients (id, owner_id, name) values
  ('a2700000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000a27', 'Client of A'),
  ('b2700000-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000b27', 'Client of B');
insert into public.measurement_sets (id, owner_id, client_id, label, data) values
  ('a2700000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000a27', 'a2700000-0000-4000-8000-000000000001', 'Set of A', '{}'),
  ('b2700000-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000b27', 'b2700000-0000-4000-8000-000000000001', 'Set of B', '{}');
insert into public.phone_otp_events (kind, user_id, phone_hash, created_at)
  values ('send', 'aaaaaaaa-0000-4000-8000-000000000a27', '\x2701', now());
insert into public.admin_audit (who, action) values ('aaaaaaaa-0000-4000-8000-000000000a27', 'test.earlier');
select private.confirm_phone('aaaaaaaa-0000-4000-8000-000000000a27', '+201099999927', '\x2799');

-- 1-4 function privileges
select is(has_function_privilege('anon', 'private.record_account_deleted()', 'execute'), false, '1 anon cannot execute record_account_deleted');
select is(has_function_privilege('authenticated', 'private.record_account_deleted()', 'execute'), false, '2 authenticated cannot execute record_account_deleted');
select is(has_function_privilege('api_app', 'private.record_account_deleted()', 'execute'), true, '3 api_app can execute record_account_deleted');
select is(has_function_privilege('service_role', 'private.record_account_deleted()', 'execute'), true, '4 service_role can execute record_account_deleted');

-- 5-6 one call adds exactly one anonymous row
create temp table audit_before as select count(*)::int as n from public.admin_audit where action = 'account.deleted';
select private.record_account_deleted();
select is((select count(*)::int from public.admin_audit where action = 'account.deleted') - (select n from audit_before), 1, '5 one call adds exactly one row');
select is((select count(*)::int from public.admin_audit where action = 'account.deleted'
  and who is null and target is null and before is null and after is null), (select n + 1 from audit_before), '6 the row holds no user id, target or data');

-- 7-12 deleting the auth user removes the personal data
delete from auth.users where id = 'aaaaaaaa-0000-4000-8000-000000000a27';
select is((select count(*)::int from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000a27'), 0, '7 profile is gone');
select is((select count(*)::int from public.clients where owner_id = 'aaaaaaaa-0000-4000-8000-000000000a27'), 0, '8 clients are gone');
select is((select count(*)::int from public.measurement_sets where owner_id = 'aaaaaaaa-0000-4000-8000-000000000a27'), 0, '9 measurement sets are gone');
select is((select count(*)::int from public.phone_otp_events where phone_hash = '\x2701'), 0, '10 phone OTP events are gone');
select is((select user_id from public.trial_phones where phone_hash = '\x2799'), null, '11 trial_phones row stays with user_id null');
select is((select who from public.admin_audit where action = 'test.earlier'), null, '12 earlier audit rows stay with who null');

-- 13-14 the other user is untouched
select is((select count(*)::int from public.clients where owner_id = 'bbbbbbbb-0000-4000-8000-000000000b27'), 1, '13 other user client is untouched');
select is((select count(*)::int from public.measurement_sets where owner_id = 'bbbbbbbb-0000-4000-8000-000000000b27'), 1, '14 other user set is untouched');

select * from finish();
rollback;
