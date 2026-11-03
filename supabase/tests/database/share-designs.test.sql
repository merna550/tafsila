-- pgTAP tests for issue #369: design-sharing consent and the admin shared-designs / unsupported-features functions. Run: pnpm db:test
begin;
select plan(20);

insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000a69', 'owner69@t.test', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000b69', 'other69@t.test', 'authenticated', 'authenticated'),
  ('cccccccc-0000-4000-8000-000000000c69', 'adm69@t.test', 'authenticated', 'authenticated');
update public.profiles set role = 'admin' where id = 'cccccccc-0000-4000-8000-000000000c69';
update public.profiles set name = 'Owner Sixtynine' where id = 'aaaaaaaa-0000-4000-8000-000000000a69';

insert into public.measurement_sets (id, owner_id, label, data) values
  ('aaaaaaaa-0000-4000-8000-0000000000e9', 'aaaaaaaa-0000-4000-8000-000000000a69', 'Set', '{}');
insert into public.designs (id, owner_id, category, title, photo_paths) values
  ('aaaaaaaa-0000-4000-8000-0000000000d9', 'aaaaaaaa-0000-4000-8000-000000000a69', 'dress', 'Owner dress', array['p/front.jpg']),
  ('bbbbbbbb-0000-4000-8000-0000000000d8', 'bbbbbbbb-0000-4000-8000-000000000b69', 'skirt', 'Other skirt', '{}');
insert into public.pattern_versions (id, design_id, owner_id, version_no, spec, measurement_set_id, measurements, ease_profile, engine_version, validation_status, input_hash) values
  ('aaaaaaaa-0000-4000-8000-0000000000f9', 'aaaaaaaa-0000-4000-8000-0000000000d9', 'aaaaaaaa-0000-4000-8000-000000000a69', 1, '{"marker":"owner-spec"}', 'aaaaaaaa-0000-4000-8000-0000000000e9', '{"bust":920}', 'regular', '0.16.0', 'pass', 'h69a'),
  ('bbbbbbbb-0000-4000-8000-0000000000f8', 'bbbbbbbb-0000-4000-8000-0000000000d8', 'bbbbbbbb-0000-4000-8000-000000000b69', 1, '{"marker":"other-spec"}', null, '{"bust":900}', 'regular', '0.16.0', 'pass', 'h69b');
update public.designs set current_version_id = 'aaaaaaaa-0000-4000-8000-0000000000f9' where id = 'aaaaaaaa-0000-4000-8000-0000000000d9';
update public.designs set current_version_id = 'bbbbbbbb-0000-4000-8000-0000000000f8' where id = 'bbbbbbbb-0000-4000-8000-0000000000d8';
insert into public.unsupported_features (design_id, owner_id, feature_text) values
  ('aaaaaaaa-0000-4000-8000-0000000000d9', 'aaaaaaaa-0000-4000-8000-000000000a69', 'detachable bow 69');

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

-- 1-3 privileges and non-admin refusal
select is(has_function_privilege('authenticated', 'private.admin_shared_designs(uuid,integer,integer)', 'execute')
       or has_function_privilege('authenticated', 'private.admin_unsupported_features(uuid,integer,integer)', 'execute'), false, '1 authenticated cannot execute the new admin functions');
select is(has_function_privilege('api_app', 'private.admin_shared_designs(uuid,integer,integer)', 'execute')
      and has_function_privilege('api_app', 'private.admin_unsupported_features(uuid,integer,integer)', 'execute'), true, '2 api_app can execute them');
select is(pg_temp.sqlstate_as('api_app', $$ select * from private.admin_shared_designs('bbbbbbbb-0000-4000-8000-000000000b69', 10, 0) $$)
  || '/' || pg_temp.sqlstate_as('api_app', $$ select * from private.admin_unsupported_features('bbbbbbbb-0000-4000-8000-000000000b69', 10, 0) $$),
  '42501/42501', '3 a non-admin id raises 42501 on both functions');

-- 4-5 default is off and the owner can switch it
select is((select share_designs from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000a69'), false, '4 share_designs is off by default');

-- 6-8 consent as the owner: can change the consent, its time is set by trigger, cannot change other columns
select pg_temp.act_as('aaaaaaaa-0000-4000-8000-000000000a69');
select lives_ok($$ update public.profiles set share_designs = true where id = 'aaaaaaaa-0000-4000-8000-000000000a69' $$, '5 the owner can update share_designs');
select pg_temp.reset();
select is((select share_designs_changed_at is not null from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000a69'), true, '6 the change time is set by the trigger');
select pg_temp.act_as('aaaaaaaa-0000-4000-8000-000000000a69');
select throws_ok($$ update public.profiles set role = 'admin' where id = 'aaaaaaaa-0000-4000-8000-000000000a69' $$, '42501', null, '7 the owner still cannot change role');
select throws_ok($$ update public.profiles set share_designs_changed_at = null where id = 'aaaaaaaa-0000-4000-8000-000000000a69' $$, '42501', null, '8 the owner cannot write the change time');
select pg_temp.reset();

-- Calls as api_app, kept in temp tables to assert on after the role is reset.
set local role api_app;
create temp table shared_on as select * from private.admin_shared_designs('cccccccc-0000-4000-8000-000000000c69', 100, 0);
create temp table unsupported_all as select * from private.admin_unsupported_features('cccccccc-0000-4000-8000-000000000c69', 100, 0);
reset role;
update public.profiles set share_designs = false where id = 'aaaaaaaa-0000-4000-8000-000000000a69';
set local role api_app;
create temp table shared_off as select * from private.admin_shared_designs('cccccccc-0000-4000-8000-000000000c69', 100, 0);
reset role;

-- 9-13 who is visible
select is((select count(*)::int from shared_on where design_id = 'aaaaaaaa-0000-4000-8000-0000000000d9'), 1, '9 the consenting owner design is visible to the admin');
select is((select count(*)::int from shared_on where design_id = 'bbbbbbbb-0000-4000-8000-0000000000d8'), 0, '10 the non-consenting owner design is invisible');
select is((select count(*)::int from shared_off where design_id = 'aaaaaaaa-0000-4000-8000-0000000000d9'), 0, '11 consent off makes the design invisible again');
select is((select current_spec ->> 'marker' || '|' || owner_display_name || '|' || photo_paths[1] from shared_on where design_id = 'aaaaaaaa-0000-4000-8000-0000000000d9'),
  'owner-spec|Owner Sixtynine|p/front.jpg', '12 the row holds the current spec, owner name and photo paths');
select is((select count(*)::int from pg_proc p where p.pronamespace = 'private'::regnamespace
  and p.proname in ('admin_shared_designs', 'admin_unsupported_features')
  and p.proargnames && array['measurements', 'measurement_set_id', 'notes', 'client_id', 'owner_id', 'user_id']
  ), 0, '13 neither function returns measurements, set, client, notes or user columns');

-- 14-16 unsupported features: text and category, no ids
select is((select count(*)::int from unsupported_all where text = 'detachable bow 69' and category = 'dress'), 1, '14 the unsupported feature is listed with its category');
select is((select array_agg(a order by a) from (select unnest(proargnames) a from pg_proc where proname = 'admin_unsupported_features' and pronamespace = 'private'::regnamespace) s where a in ('owner_id', 'design_id', 'user_id')), null, '15 the unsupported function returns no user or design id column');
select is((select count(*)::int from unsupported_all), (select count(*)::int from public.unsupported_features), '16 every unsupported feature is listed');

-- 17-18 paging
select is((select count(*)::int from private.admin_shared_designs('cccccccc-0000-4000-8000-000000000c69', 1, 5000)), 0, '17 an offset past the end returns no rows');
select is((select max(total)::int from shared_on), (select count(*)::int from shared_on), '18 total counts every shared design');

-- 19-20 audit
select is((select count(*)::int from public.admin_audit where who = 'cccccccc-0000-4000-8000-000000000c69' and action = 'admin.designs.list'), 3, '19 each shared-designs call wrote an audit row (two above, one in test 17)');
select is((select count(*)::int from public.admin_audit where who = 'cccccccc-0000-4000-8000-000000000c69' and action = 'admin.unsupported.list'), 1, '20 the unsupported call wrote an audit row');

select * from finish();
rollback;
