-- pgTAP tests for issue #317: fabrics, fabric_rules and fabric_calcs RLS, grants, constraints, cascade. Run: pnpm db:test
begin;
select plan(27);

insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a@t.test', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b@t.test', 'authenticated', 'authenticated'),
  ('cccccccc-0000-4000-8000-000000000003', 'c@t.test', 'authenticated', 'authenticated');
update public.profiles set role = 'admin' where id = 'cccccccc-0000-4000-8000-000000000003';

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
create function pg_temp.affected(q text) returns int language plpgsql as $$
declare n int;
begin
  execute q;
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function pg_temp.act_as(uuid), pg_temp.reset(), pg_temp.affected(text) to public;

-- 1-3 the migration seed is readable by signed-in users, not by anon
select pg_temp.act_as('bbbbbbbb-0000-4000-8000-000000000002');
select is((select count(*)::int from public.fabrics), 16, '1 a signed-in user reads the 16 seeded fabrics');
select is((select count(*)::int from public.fabric_rules), 21, '2 a signed-in user reads the 21 seeded rules');
select pg_temp.reset();
set local role anon;
select throws_ok($$ select * from public.fabrics $$, '42501', null, '3 anon cannot read fabrics');
select pg_temp.reset();

-- 4-8 a non-admin cannot write the catalogue or the rules
select pg_temp.act_as('bbbbbbbb-0000-4000-8000-000000000002');
select throws_ok(
  $$ insert into public.fabrics (id, name_ar, name_en, properties, care_notes) values ('x-fabric', 'س', 'X', '{}', '{}') $$,
  '42501', null, '4 a non-admin cannot insert a fabric');
select is(pg_temp.affected($q$update public.fabrics set name_en = 'hacked' where id = 'crepe'$q$), 0,
  '5 a non-admin update of a fabric changes no row');
select is(pg_temp.affected($q$delete from public.fabrics where id = 'crepe'$q$), 0,
  '6 a non-admin delete of a fabric removes no row');
select throws_ok(
  $$ insert into public.fabric_rules (id, condition, required_properties, priority, reason) values ('x-rule', '[]', '{}', 3, '{}') $$,
  '42501', null, '7 a non-admin cannot insert a rule');
select is(pg_temp.affected($q$update public.fabric_rules set priority = 1$q$), 0,
  '8 a non-admin update of rules changes no row');

-- 9-14 an admin can write; the id slug and the priority range are checked
select pg_temp.act_as('cccccccc-0000-4000-8000-000000000003');
select lives_ok(
  $$ insert into public.fabrics (id, name_ar, name_en, properties, care_notes, is_draft, updated_by)
     values ('organza', 'أورجانزا', 'Organza', '{"drape":1}', '{"ar":"x","en":"y"}', false, 'cccccccc-0000-4000-8000-000000000003') $$,
  '9 an admin can insert a fabric');
select is(pg_temp.affected($q$update public.fabrics set name_en = 'Organza silk' where id = 'organza'$q$), 1,
  '10 an admin can update a fabric');
select lives_ok(
  $$ insert into public.fabric_rules (id, condition, required_properties, priority, reason)
     values ('test-rule', '[]', '{"property":"drape"}', 3, '{"ar":"x","en":"y"}') $$,
  '11 an admin can insert a rule');
select is(pg_temp.affected($q$delete from public.fabric_rules where id = 'test-rule'$q$), 1,
  '12 an admin can delete a rule');
select throws_ok(
  $$ insert into public.fabrics (id, name_ar, name_en, properties, care_notes) values ('Bad Id', 'س', 'X', '{}', '{}') $$,
  '23514', null, '13 an id that is not a kebab-case slug is refused');
select throws_ok(
  $$ insert into public.fabric_rules (id, condition, required_properties, priority, reason) values ('prio-rule', '[]', '{}', 6, '{}') $$,
  '23514', null, '14 a priority above 5 is refused');

-- set-up of a user's version for the calculation tests
select pg_temp.act_as('aaaaaaaa-0000-4000-8000-000000000001');
insert into public.designs (id, category, title) values ('aaaaaaaa-0000-4000-8000-0000000000d1', 'dress', 'A dress');
insert into public.pattern_versions (id, design_id, version_no, spec, measurements, ease_profile, engine_version, validation_status, input_hash)
  values ('aaaaaaaa-0000-4000-8000-0000000000f1', 'aaaaaaaa-0000-4000-8000-0000000000d1', 1, '{}', '{}', 'regular', '0.16.0', 'pass', 'h1');

-- 15-17 the owner stores and reads a calculation; one row per version and options
select lives_ok(
  $$ insert into public.fabric_calcs (pattern_version_id, options, options_hash, result, nesting_version)
     values ('aaaaaaaa-0000-4000-8000-0000000000f1', '{"widthMm":1400}', 'hash-1', '{"kinds":[]}', '1.0.0') $$,
  '15 the owner can store a calculation for their version');
select is((select count(*)::int from public.fabric_calcs), 1, '16 the owner reads their calculation');
select throws_ok(
  $$ insert into public.fabric_calcs (pattern_version_id, options, options_hash, result, nesting_version)
     values ('aaaaaaaa-0000-4000-8000-0000000000f1', '{"widthMm":1400}', 'hash-1', '{"kinds":[]}', '1.0.1') $$,
  '23505', null, '17 a second row for the same version and options is refused');

-- 18-22 another user sees and changes nothing
select pg_temp.act_as('bbbbbbbb-0000-4000-8000-000000000002');
select is((select count(*)::int from public.fabric_calcs), 0, '18 another user reads no calculation of A');
select throws_ok(
  $$ insert into public.fabric_calcs (pattern_version_id, owner_id, options, options_hash, result, nesting_version)
     values ('aaaaaaaa-0000-4000-8000-0000000000f1', 'aaaaaaaa-0000-4000-8000-000000000001', '{}', 'hash-2', '{}', '1.0.0') $$,
  '42501', null, '19 another user cannot store a calculation owned by A (policy)');
select throws_ok(
  $$ insert into public.fabric_calcs (pattern_version_id, options, options_hash, result, nesting_version)
     values ('aaaaaaaa-0000-4000-8000-0000000000f1', '{}', 'hash-3', '{}', '1.0.0') $$,
  '23503', null, '20 another user cannot attach a calculation to the version of A (composite FK)');
select is(pg_temp.affected($q$update public.fabric_calcs set nesting_version = 'x'$q$), 0,
  '21 another user cannot update the calculation of A');
select is(pg_temp.affected($q$delete from public.fabric_calcs$q$), 0,
  '22 another user cannot delete the calculation of A');

-- 23-24 an admin reads but does not write calculations of users
select pg_temp.act_as('cccccccc-0000-4000-8000-000000000003');
select is((select count(*)::int from public.fabric_calcs), 1, '23 an admin can read the calculation');
select throws_ok(
  $$ insert into public.fabric_calcs (pattern_version_id, owner_id, options, options_hash, result, nesting_version)
     values ('aaaaaaaa-0000-4000-8000-0000000000f1', 'aaaaaaaa-0000-4000-8000-000000000001', '{}', 'hash-4', '{}', '1.0.0') $$,
  '42501', null, '24 an admin cannot store a calculation for A');

-- 25-26 audit rows of admin writes: only an admin appends them, as themselves
select pg_temp.act_as('bbbbbbbb-0000-4000-8000-000000000002');
select throws_ok($$ insert into public.admin_audit (who, action, target) values (auth.uid(), 'fabric.created', 'organza') $$,
  '42501', null, '25 a non-admin cannot append an audit row');
select pg_temp.act_as('cccccccc-0000-4000-8000-000000000003');
select lives_ok($$ insert into public.admin_audit (who, action, target, after) values (auth.uid(), 'fabric.created', 'organza', '{"id":"organza"}') $$,
  '26 an admin appends the audit row of a fabric write');

-- 27 deleting the design removes its versions and their calculations
select pg_temp.reset();
delete from public.designs where id = 'aaaaaaaa-0000-4000-8000-0000000000d1';
select is((select count(*)::int from public.fabric_calcs), 0, '27 deleting the design cascades to its calculations');

select * from finish();
rollback;
