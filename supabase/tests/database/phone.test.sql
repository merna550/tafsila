-- pgTAP tests for issue #26 part A: trial_phones, phone_otp_events, the private phone functions. Run: pnpm db:test
-- Uses numbers outside the seed (+201000000001..9) because the seed already holds some of them.
begin;
select plan(31);

insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000a01', 'pa@t.test', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000b02', 'pb@t.test', 'authenticated', 'authenticated'),
  ('cccccccc-0000-4000-8000-000000000c03', 'pc@t.test', 'authenticated', 'authenticated');

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

-- 1-2 RLS enabled
select is((select relrowsecurity from pg_class where oid = 'public.trial_phones'::regclass), true, '1 RLS on trial_phones');
select is((select relrowsecurity from pg_class where oid = 'public.phone_otp_events'::regclass), true, '2 RLS on phone_otp_events');

-- 3-6 anon and authenticated cannot touch the tables
select pg_temp.act_as('aaaaaaaa-0000-4000-8000-000000000a01');
select throws_ok($$ select * from public.trial_phones $$, '42501', null, '3 authenticated cannot select trial_phones');
select throws_ok($$ insert into public.trial_phones (phone_hash) values ('\x01') $$, '42501', null, '4 authenticated cannot insert trial_phones');
select throws_ok($$ select * from public.phone_otp_events $$, '42501', null, '5 authenticated cannot select phone_otp_events');
select throws_ok($$ delete from public.phone_otp_events $$, '42501', null, '6 authenticated cannot delete phone_otp_events');
select pg_temp.reset();
set local role anon;
select throws_ok($$ select * from public.trial_phones $$, '42501', null, '7 anon cannot select trial_phones');
select throws_ok($$ select * from public.phone_otp_events $$, '42501', null, '8 anon cannot select phone_otp_events');
reset role;

-- 9-12 function privileges
select is(has_function_privilege('authenticated', 'private.confirm_phone(uuid,text,bytea)', 'execute'), false, '9 authenticated cannot execute confirm_phone');
select is(has_function_privilege('anon', 'private.phone_otp_attempt(text,uuid,bytea,bytea,jsonb,boolean)', 'execute'), false, '10 anon cannot execute phone_otp_attempt');
select is(has_function_privilege('api_app', 'private.confirm_phone(uuid,text,bytea)', 'execute')
      and has_function_privilege('api_app', 'private.phone_status(uuid,text,bytea)', 'execute')
      and has_function_privilege('api_app', 'private.is_trial_eligible(uuid)', 'execute')
      and has_function_privilege('api_app', 'private.phone_otp_attempt(text,uuid,bytea,bytea,jsonb,boolean)', 'execute'),
  true, '11 api_app can execute the private functions');
select is(has_function_privilege('service_role', 'private.confirm_phone(uuid,text,bytea)', 'execute'), true, '12 service_role can execute confirm_phone');

-- 13 authenticated still cannot write the verified phone
select pg_temp.act_as('aaaaaaaa-0000-4000-8000-000000000a01');
select throws_ok($$ update public.profiles set phone = '+201099999991' where id = auth.uid() $$, '42501', null, '13 authenticated cannot update profiles.phone');
select pg_temp.reset();

-- 14-16 A confirms hash H
select private.confirm_phone('aaaaaaaa-0000-4000-8000-000000000a01', '+201099999991', '\x0101');
select is((select phone from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000a01'), '+201099999991', '14 profile phone set');
select isnt((select phone_verified_at from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000a01'), null, '15 profile verified');
select is(private.is_trial_eligible('aaaaaaaa-0000-4000-8000-000000000a01'), true, '16 A is trial eligible');

-- 17-18 B cannot take the same number
select throws_ok($$ select private.confirm_phone('bbbbbbbb-0000-4000-8000-000000000b02', '+201099999991', '\x0101') $$,
  'PH001', 'phone_already_used', '17 second account is refused');
select is((select phone_verified_at from public.profiles where id = 'bbbbbbbb-0000-4000-8000-000000000b02'), null, '18 B profile unchanged');

-- 19 A confirming twice
select throws_ok($$ select private.confirm_phone('aaaaaaaa-0000-4000-8000-000000000a01', '+201099999992', '\x0102') $$,
  'PH002', 'phone_already_verified', '19 A cannot verify twice');

-- 20-22 deleting A keeps the hash
delete from auth.users where id = 'aaaaaaaa-0000-4000-8000-000000000a01';
select is((select count(*)::int from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000a01'), 0, '20 A profile is gone');
select is((select user_id from public.trial_phones where phone_hash = '\x0101'), null, '21 trial_phones row kept with user_id null');
select throws_ok($$ select private.confirm_phone('bbbbbbbb-0000-4000-8000-000000000b02', '+201099999991', '\x0101') $$,
  'PH001', 'phone_already_used', '22 B still refused after A is deleted');

-- 23 C with another number is fine, 24 trial_granted_at ends eligibility
select is((private.confirm_phone('cccccccc-0000-4000-8000-000000000c03', '+201099999993', '\x0103') ->> 'trial_eligible')::boolean, true, '23 C confirms another number');
update public.trial_phones set trial_granted_at = now() where phone_hash = '\x0103';
select is(private.is_trial_eligible('cccccccc-0000-4000-8000-000000000c03'), false, '24 granted trial is no longer eligible');

-- 25 status
select is(private.phone_status('bbbbbbbb-0000-4000-8000-000000000b02', '+201099999991', '\x0101') ->> 'number', 'taken', '25 status says taken');

-- 26 another user sees no foreign phone
select pg_temp.act_as('bbbbbbbb-0000-4000-8000-000000000b02');
select is((select count(*)::int from public.profiles where phone is not null), 0, '26 B sees no foreign phone');
select pg_temp.reset();

-- 27-29 rate limits: the sixth send in an hour is refused; another account is not blocked by the account scope
insert into public.phone_otp_events (kind, user_id, phone_hash, ip_hash, created_at)
  select 'send', 'bbbbbbbb-0000-4000-8000-000000000b02', '\x0201', '\xaa', now() - interval '10 minutes' from generate_series(1, 5);
select is(private.phone_otp_attempt('send', 'bbbbbbbb-0000-4000-8000-000000000b02', '\x0299', '\xbb',
  '[{"scope":"account","window_seconds":3600,"max":5}]', true) ->> 'allowed', 'false', '27 sixth send in an hour is refused');
select is(private.phone_otp_attempt('send', 'cccccccc-0000-4000-8000-000000000c03', '\x0298', '\xcc',
  '[{"scope":"account","window_seconds":3600,"max":5}]', true) ->> 'allowed', 'true', '28 other account is not blocked by the account scope');
select is(private.phone_otp_attempt('send', 'cccccccc-0000-4000-8000-000000000c03', '\x0297', '\xaa',
  '[{"scope":"ip","window_seconds":3600,"max":5}]', false) ->> 'scope', 'ip', '29 the shared ip scope counts both accounts');

-- 30 events older than 24 hours are purged
insert into public.phone_otp_events (kind, user_id, phone_hash, created_at)
  values ('send', 'cccccccc-0000-4000-8000-000000000c03', '\x0296', now() - interval '25 hours');
select private.phone_otp_attempt('send', 'cccccccc-0000-4000-8000-000000000c03', '\x0295', null, '[]', false);
select is((select count(*)::int from public.phone_otp_events where phone_hash = '\x0296'), 0, '30 old events are purged');

-- 31-32 the API login role runs the private functions but still reads no table
create function pg_temp.api_app_phone_probe() returns text language plpgsql as $$
declare v_read text; v_call text;
begin
  set local role api_app;
  begin
    perform 1 from public.profiles limit 1;
    v_read := 'read';
  exception when insufficient_privilege then v_read := '42501';
  end;
  begin
    perform private.is_trial_eligible('cccccccc-0000-4000-8000-000000000c03');
    v_call := 'ok';
  exception when others then v_call := sqlstate;
  end;
  reset role;
  return v_read || '/' || v_call;
end $$;
grant execute on function pg_temp.api_app_phone_probe() to public;
select is(pg_temp.api_app_phone_probe(), '42501/ok', '31-32 api_app reads no table but can call the private functions');

select * from finish();
rollback;
