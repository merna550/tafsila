-- pgTAP tests for issue #32 part A: the private admin functions (users list, detail, stats). Run: pnpm db:test
-- The seed already has users, so every check filters by the unique e-mails below or compares against counts taken before.
begin;
select plan(24);

insert into auth.users (id, email, aud, role, last_sign_in_at) values
  ('aaaaaaaa-0000-4000-8000-000000000a32', 'adm32@t.test', 'authenticated', 'authenticated', now()),
  ('bbbbbbbb-0000-4000-8000-000000000b32', 'mona32@t.test', 'authenticated', 'authenticated', null),
  ('cccccccc-0000-4000-8000-000000000c32', 'sara_32@t.test', 'authenticated', 'authenticated', null);
update public.profiles set role = 'admin' where id = 'aaaaaaaa-0000-4000-8000-000000000a32';
update public.profiles set name = 'Mona Test32', phone = '+201099999932', phone_verified_at = now()
  where id = 'bbbbbbbb-0000-4000-8000-000000000b32';
insert into public.clients (owner_id, name, notes) values
  ('bbbbbbbb-0000-4000-8000-000000000b32', 'Client One', 'private note'),
  ('bbbbbbbb-0000-4000-8000-000000000b32', 'Client Two', null);

-- Runs a statement as a role and returns the SQLSTATE it raised ('ok' when it did not).
create function pg_temp.sqlstate_as(r text, stmt text) returns text language plpgsql as $$
declare state text := 'ok';
begin
  execute format('set local role %I', r);
  begin
    execute stmt;
  exception when others then
    state := sqlstate;
  end;
  reset role;
  return state;
end $$;
grant execute on function pg_temp.sqlstate_as(text, text) to public;

-- 1-6 privileges
select is(has_function_privilege('anon', 'private.admin_users(uuid,text,boolean,integer,integer)', 'execute'), false, '1 anon cannot execute admin_users');
select is(has_function_privilege('authenticated', 'private.admin_users(uuid,text,boolean,integer,integer)', 'execute'), false, '2 authenticated cannot execute admin_users');
select is(has_function_privilege('authenticated', 'private.admin_user(uuid,uuid)', 'execute')
       or has_function_privilege('authenticated', 'private.admin_stats(uuid)', 'execute')
       or has_function_privilege('authenticated', 'private.assert_admin(uuid)', 'execute'), false, '3 authenticated cannot execute the other admin functions');
select is(has_function_privilege('api_app', 'private.admin_users(uuid,text,boolean,integer,integer)', 'execute')
      and has_function_privilege('api_app', 'private.admin_user(uuid,uuid)', 'execute')
      and has_function_privilege('api_app', 'private.admin_stats(uuid)', 'execute'), true, '4 api_app can execute the admin functions');
select is(has_function_privilege('service_role', 'private.admin_users(uuid,text,boolean,integer,integer)', 'execute'), true, '5 service_role can execute admin_users');
select is(pg_temp.sqlstate_as('authenticated', $$ select * from private.admin_stats('aaaaaaaa-0000-4000-8000-000000000a32') $$),
  '42501', '6 authenticated is refused by the database (permission denied)');

-- 7-9 a non-admin id (and a null or unknown id) is refused
select is(pg_temp.sqlstate_as('api_app', $$ select * from private.admin_users('bbbbbbbb-0000-4000-8000-000000000b32', null, null, 10, 0) $$),
  '42501', '7 a normal user id raises on admin_users');
select is(pg_temp.sqlstate_as('api_app', $$ select * from private.admin_stats('bbbbbbbb-0000-4000-8000-000000000b32') $$),
  '42501', '8 a normal user id raises on admin_stats');
select is(pg_temp.sqlstate_as('api_app', $$ select * from private.admin_user(null, 'bbbbbbbb-0000-4000-8000-000000000b32') $$),
  '42501', '9 a null admin id raises on admin_user');

-- Calls as api_app, results kept in temp tables to assert on after the role is reset.
set local role api_app;
create temp table list_all as select * from private.admin_users('aaaaaaaa-0000-4000-8000-000000000a32', null, null, 100, 0);
create temp table list_mona as select * from private.admin_users('aaaaaaaa-0000-4000-8000-000000000a32', 'mona32', null, 10, 0);
create temp table list_phone as select * from private.admin_users('aaaaaaaa-0000-4000-8000-000000000a32', '99999932', null, 10, 0);
create temp table list_underscore as select * from private.admin_users('aaaaaaaa-0000-4000-8000-000000000a32', 'sara_32', null, 10, 0);
create temp table list_wildcard as select * from private.admin_users('aaaaaaaa-0000-4000-8000-000000000a32', '%32@t.test', null, 10, 0);
create temp table list_verified as select * from private.admin_users('aaaaaaaa-0000-4000-8000-000000000a32', '32@t.test', true, 10, 0);
create temp table list_unverified as select * from private.admin_users('aaaaaaaa-0000-4000-8000-000000000a32', '32@t.test', false, 10, 0);
create temp table list_page as select * from private.admin_users('aaaaaaaa-0000-4000-8000-000000000a32', '32@t.test', null, 2, 2);
create temp table one_user as select * from private.admin_user('aaaaaaaa-0000-4000-8000-000000000a32', 'bbbbbbbb-0000-4000-8000-000000000b32');
create temp table no_user as select * from private.admin_user('aaaaaaaa-0000-4000-8000-000000000a32', 'dddddddd-0000-4000-8000-000000000d32');
create temp table stats as select * from private.admin_stats('aaaaaaaa-0000-4000-8000-000000000a32');
reset role;

-- 10-16 the list
select is((select count(*)::int from list_all), (select count(*)::int from public.profiles), '10 admin sees every user');
select is((select count(*)::int from list_mona), 1, '11 search finds a user by e-mail');
select is((select count(*)::int from list_phone), 1, '12 search finds a user by phone');
select is((select count(*)::int from list_underscore), 1, '13 an underscore is matched literally');
select is((select count(*)::int from list_wildcard), 0, '14 a percent sign is matched literally, not as a wildcard');
select is((select count(*)::int from list_verified) || '/' || (select count(*)::int from list_unverified), '1/2', '15 the verified filter splits users with and without a verified phone');
select is((select count(*)::int from list_page) || '/' || (select max(total)::int from list_page), '1/3', '16 limit and offset page the result, total counts all matches');

-- 17-20 what a row holds
select is((select client_count from list_mona), 2, '17 client count is returned');
select is((select name || '|' || phone from list_mona), 'Mona Test32|+201099999932', '18 name and phone are returned');
select is((select last_sign_in_at is not null from list_all where email = 'adm32@t.test'), true, '19 last sign-in comes from auth.users');
select is((select count(*)::int from pg_proc p where p.pronamespace = 'private'::regnamespace and p.proname in ('admin_users', 'admin_user', 'admin_stats')
  and p.proargnames && array['notes', 'data', 'sizes', 'measurements']), 0, '20 no admin function returns measurements, notes or chart data');

-- 21-22 detail
select is((select client_count || '/' || measurement_set_count || '/' || role from one_user), '2/0/user', '21 detail has counts and role');
select is((select count(*)::int from no_user), 0, '22 an unknown id returns no row');

-- 23-24 stats
select is((select users from stats), (select count(*)::int from public.profiles), '23 stats count every user');
select is((select verified_phones from stats), (select count(*)::int from public.profiles where phone_verified_at is not null), '24 stats count verified phones');

select * from finish();
rollback;
