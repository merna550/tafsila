-- pgTAP tests for issue #237: designs and pattern_versions RLS, grants, constraints, cascade. Run: pnpm db:test
begin;
select plan(17);

insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a@t.test', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b@t.test', 'authenticated', 'authenticated'),
  ('cccccccc-0000-4000-8000-000000000003', 'c@t.test', 'authenticated', 'authenticated');
update public.profiles set role = 'admin' where id = 'cccccccc-0000-4000-8000-000000000003';
insert into public.measurement_sets (id, owner_id, label, data) values
  ('aaaaaaaa-0000-4000-8000-0000000000e1', 'aaaaaaaa-0000-4000-8000-000000000001', 'A set', '{}');

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

-- 1-2 owner reads and writes
select pg_temp.act_as('aaaaaaaa-0000-4000-8000-000000000001');
select lives_ok(
  $$ insert into public.designs (id, category, title) values ('aaaaaaaa-0000-4000-8000-0000000000d1', 'dress', 'A dress') $$,
  '1 A can create a design');
select lives_ok(
  $$ insert into public.pattern_versions (id, design_id, version_no, spec, measurement_set_id, measurements, ease_profile, engine_version, validation_status, input_hash)
     values ('aaaaaaaa-0000-4000-8000-0000000000f1', 'aaaaaaaa-0000-4000-8000-0000000000d1', 1, '{}', 'aaaaaaaa-0000-4000-8000-0000000000e1', '{"bust":920}', 'regular', '0.16.0', 'pass', 'h1') $$,
  '2 A can create a version');

-- 3-5 B sees nothing and cannot write into A's design
select pg_temp.act_as('bbbbbbbb-0000-4000-8000-000000000002');
select is((select count(*)::int from public.designs) + (select count(*)::int from public.pattern_versions), 0,
  '3 B reads no design and no version of A');
select throws_ok(
  $$ insert into public.pattern_versions (design_id, version_no, spec, measurements, ease_profile, engine_version, validation_status, input_hash)
     values ('aaaaaaaa-0000-4000-8000-0000000000d1', 2, '{}', '{}', 'regular', '0.16.0', 'pass', 'x') $$,
  '23503', null, '4 B cannot add a version to A design (composite FK)');
select throws_ok(
  $$ insert into public.pattern_versions (design_id, owner_id, version_no, spec, measurements, ease_profile, engine_version, validation_status, input_hash)
     values ('aaaaaaaa-0000-4000-8000-0000000000d1', 'aaaaaaaa-0000-4000-8000-000000000001', 2, '{}', '{}', 'regular', '0.16.0', 'pass', 'x') $$,
  '42501', null, '5 B cannot add a version owned by A (policy)');

-- 6-7 admin reads, cannot write
select pg_temp.act_as('cccccccc-0000-4000-8000-000000000003');
select is((select count(*)::int from public.designs) + (select count(*)::int from public.pattern_versions), 2,
  '6 admin can read the design and the version');
select throws_ok(
  $$ insert into public.pattern_versions (design_id, owner_id, version_no, spec, measurements, ease_profile, engine_version, validation_status, input_hash)
     values ('aaaaaaaa-0000-4000-8000-0000000000d1', 'aaaaaaaa-0000-4000-8000-000000000001', 2, '{}', '{}', 'regular', '0.16.0', 'pass', 'x') $$,
  '42501', null, '7 admin cannot insert a version for A');

-- 8-9 append-only
select pg_temp.act_as('aaaaaaaa-0000-4000-8000-000000000001');
select throws_ok($$ update public.pattern_versions set size_label = 'L' $$, '42501', null, '8 A cannot update a version');
select throws_ok($$ delete from public.pattern_versions $$, '42501', null, '9 A cannot delete a version');

-- 10-12 constraints
select throws_ok(
  $$ insert into public.pattern_versions (design_id, version_no, spec, measurements, ease_profile, engine_version, validation_status, input_hash)
     values ('aaaaaaaa-0000-4000-8000-0000000000d1', 1, '{}', '{}', 'regular', '0.16.0', 'pass', 'x') $$,
  '23505', null, '10 duplicate (design_id, version_no) is refused');
select lives_ok(
  $$ insert into public.pattern_versions (design_id, version_no, spec, measurements, ease_profile, engine_version, validation_status, input_hash)
     values ('aaaaaaaa-0000-4000-8000-0000000000d1', 2, '{}', '{}', 'regular', '0.16.0', 'warn', 'h1') $$,
  '11 two versions may share an input_hash (restore)');
select throws_ok(
  $$ insert into public.pattern_versions (design_id, version_no, spec, measurements, ease_profile, engine_version, validation_status, input_hash)
     values ('aaaaaaaa-0000-4000-8000-0000000000d1', 3, '{}', '{}', 'regular', '0.16.0', 'fail', 'x') $$,
  '23514', null, '12 validation_status fail is refused');

-- 13 current version pointer, 14 measurement set deletion keeps the snapshot
update public.designs set current_version_id = 'aaaaaaaa-0000-4000-8000-0000000000f1';
delete from public.measurement_sets where id = 'aaaaaaaa-0000-4000-8000-0000000000e1';
select pg_temp.reset();
select is((select measurements ->> 'bust' from public.pattern_versions where version_no = 1), '920',
  '13 deleting the measurement set keeps the snapshot');
select is((select measurement_set_id from public.pattern_versions where version_no = 1), null,
  '14 and nulls measurement_set_id');

-- 15 account deletion removes designs and versions; 16 design delete cascades
insert into public.designs (id, owner_id, category, title) values
  ('bbbbbbbb-0000-4000-8000-0000000000d2', 'bbbbbbbb-0000-4000-8000-000000000002', 'skirt', 'B skirt');
insert into public.pattern_versions (design_id, owner_id, version_no, spec, measurements, ease_profile, engine_version, validation_status, input_hash)
  values ('bbbbbbbb-0000-4000-8000-0000000000d2', 'bbbbbbbb-0000-4000-8000-000000000002', 1, '{}', '{}', 'regular', '0.16.0', 'pass', 'h');
delete from public.designs where id = 'bbbbbbbb-0000-4000-8000-0000000000d2';
select is((select count(*)::int from public.pattern_versions where owner_id = 'bbbbbbbb-0000-4000-8000-000000000002'), 0,
  '15 deleting a design deletes its versions');
delete from auth.users where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is((select count(*)::int from public.designs) + (select count(*)::int from public.pattern_versions), 0,
  '16 deleting the account removes designs and versions');

-- 17 api_app alone has no table access
select throws_ok(
  $$ set local role api_app; select count(*) from public.designs $$,
  '42501', null, '17 api_app without the authenticated role cannot read designs');

select * from finish();
rollback;
