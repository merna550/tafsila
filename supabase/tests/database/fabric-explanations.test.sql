-- pgTAP tests for issue #346: fabric_explanations RLS, grants, constraints, cascade. Run: pnpm db:test
begin;
select plan(9);

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
grant execute on function pg_temp.act_as(uuid), pg_temp.reset() to public;

-- set-up of a user's version
select pg_temp.act_as('aaaaaaaa-0000-4000-8000-000000000001');
insert into public.designs (id, category, title) values ('aaaaaaaa-0000-4000-8000-0000000000d1', 'dress', 'A dress');
insert into public.pattern_versions (id, design_id, version_no, spec, measurements, ease_profile, engine_version, validation_status, input_hash)
  values ('aaaaaaaa-0000-4000-8000-0000000000f1', 'aaaaaaaa-0000-4000-8000-0000000000d1', 1, '{}', '{}', 'regular', '0.16.0', 'pass', 'h1');

-- 1-3 the owner stores and reads an explanation; one row per version, language and catalogue state
select lives_ok(
  $$ insert into public.fabric_explanations (pattern_version_id, locale, catalogue_hash, text)
     values ('aaaaaaaa-0000-4000-8000-0000000000f1', 'ar', 'hash-1', 'نص') $$,
  '1 the owner can store an explanation for their version');
select is((select count(*)::int from public.fabric_explanations), 1, '2 the owner reads their explanation');
select throws_ok(
  $$ insert into public.fabric_explanations (pattern_version_id, locale, catalogue_hash, text)
     values ('aaaaaaaa-0000-4000-8000-0000000000f1', 'ar', 'hash-1', 'نص آخر') $$,
  '23505', null, '3 a second row for the same version, language and catalogue state is refused');

-- 4-5 constraints
select throws_ok(
  $$ insert into public.fabric_explanations (pattern_version_id, locale, catalogue_hash, text)
     values ('aaaaaaaa-0000-4000-8000-0000000000f1', 'fr', 'hash-2', 'x') $$,
  '23514', null, '4 a language other than ar and en is refused');
select throws_ok(
  $$ insert into public.fabric_explanations (pattern_version_id, locale, catalogue_hash, text)
     values ('aaaaaaaa-0000-4000-8000-0000000000f1', 'en', 'hash-2', '') $$,
  '23514', null, '5 an empty text is refused');

-- 6-8 another user and an admin see and change nothing
select pg_temp.act_as('bbbbbbbb-0000-4000-8000-000000000002');
select is((select count(*)::int from public.fabric_explanations), 0, '6 another user reads no explanation of A');
select throws_ok(
  $$ insert into public.fabric_explanations (pattern_version_id, locale, catalogue_hash, text)
     values ('aaaaaaaa-0000-4000-8000-0000000000f1', 'en', 'hash-3', 'x') $$,
  '23503', null, '7 another user cannot attach an explanation to the version of A (composite FK)');
select pg_temp.act_as('cccccccc-0000-4000-8000-000000000003');
select is((select count(*)::int from public.fabric_explanations), 0, '8 an admin cannot read explanations either');

-- 9 deleting the design removes its versions and their explanations
select pg_temp.reset();
delete from public.designs where id = 'aaaaaaaa-0000-4000-8000-0000000000d1';
select is((select count(*)::int from public.fabric_explanations), 0, '9 deleting the design cascades to its explanations');

select * from finish();
rollback;
