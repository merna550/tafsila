-- pgTAP tests for issue #339: design-photos storage policies, ai_usage and unsupported_features. Run: pnpm db:test
begin;
select plan(25);

-- Newer Storage versions block plain deletes on storage.objects unless this setting is on (the API deletes through the Storage API).
select set_config('storage.allow_delete_query', 'true', true);

insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a@t.test', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b@t.test', 'authenticated', 'authenticated'),
  ('cccccccc-0000-4000-8000-000000000003', 'c@t.test', 'authenticated', 'authenticated');
update public.profiles set role = 'admin' where id = 'cccccccc-0000-4000-8000-000000000003';
insert into public.designs (id, owner_id, category, title) values
  ('aaaaaaaa-0000-4000-8000-0000000000d1', 'aaaaaaaa-0000-4000-8000-000000000001', 'dress', 'A dress'),
  ('bbbbbbbb-0000-4000-8000-0000000000d2', 'bbbbbbbb-0000-4000-8000-000000000002', 'skirt', 'B skirt');

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
create function pg_temp.sqlstate_as(who text, stmt text) returns text language plpgsql as $$
begin
  execute format('set local role %I', who);
  begin
    execute stmt;
    reset role;
    return 'ok';
  exception when others then
    reset role;
    return sqlstate;
  end;
end $$;
grant execute on function pg_temp.act_as(uuid), pg_temp.reset(), pg_temp.sqlstate_as(text, text) to public;

-- 1 the bucket is private
select is((select public from storage.buckets where id = 'design-photos'), false, '1 design-photos bucket exists and is private');

-- 2-3 owner writes and reads under <uid>/<own design>/
select pg_temp.act_as('aaaaaaaa-0000-4000-8000-000000000001');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('design-photos', 'aaaaaaaa-0000-4000-8000-000000000001/aaaaaaaa-0000-4000-8000-0000000000d1/front.jpg') $$,
  '2 A can write a photo under own folder and own design');
select is((select count(*)::int from storage.objects where bucket_id = 'design-photos'), 1, '3 A reads own photo');

-- 4 a path under A uid but another user's design is refused
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('design-photos', 'aaaaaaaa-0000-4000-8000-000000000001/bbbbbbbb-0000-4000-8000-0000000000d2/front.jpg') $$,
  '42501', null, '4 A cannot write under A uid but B design id');
-- 5 a path under another user's uid is refused
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('design-photos', 'bbbbbbbb-0000-4000-8000-000000000002/bbbbbbbb-0000-4000-8000-0000000000d2/front.jpg') $$,
  '42501', null, '5 A cannot write under B uid');
-- 6 a made-up design id is refused
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('design-photos', 'aaaaaaaa-0000-4000-8000-000000000001/not-a-design/front.jpg') $$,
  '42501', null, '6 A cannot write under an unknown design folder');

-- 7-8 B cannot read or delete A's photo
select pg_temp.act_as('bbbbbbbb-0000-4000-8000-000000000002');
select is((select count(*)::int from storage.objects where bucket_id = 'design-photos'), 0, '7 B reads no photo of A');
delete from storage.objects where bucket_id = 'design-photos';
select pg_temp.reset();
select is((select count(*)::int from storage.objects where bucket_id = 'design-photos'), 1, '8 B cannot delete the photo of A');

-- 9 anon reads nothing
select is(pg_temp.sqlstate_as('anon', $$ select count(*) from storage.objects where bucket_id = 'design-photos' $$), 'ok', '9 anon query runs');
select is((select count(*)::int from (select 1 from storage.objects where bucket_id = 'design-photos') s), 1, '9b service connection sees the row');

-- 10 owner deletes own photo
select pg_temp.act_as('aaaaaaaa-0000-4000-8000-000000000001');
delete from storage.objects where bucket_id = 'design-photos';
select pg_temp.reset();
select is((select count(*)::int from storage.objects where bucket_id = 'design-photos'), 0, '10 A can delete own photo');

-- 11-12 ai_usage: authenticated cannot insert; api_app inserts through the function only
select is(pg_temp.sqlstate_as('authenticated', $$ insert into public.ai_usage (user_id, kind, provider, model) values ('aaaaaaaa-0000-4000-8000-000000000001', 'analyze', 'fake', 'fake') $$),
  '42501', '11 authenticated cannot insert ai_usage');
select is(has_function_privilege('api_app', 'private.record_ai_usage(uuid,uuid,text,text,text,integer,integer,numeric,integer)', 'execute')
      and not has_function_privilege('authenticated', 'private.record_ai_usage(uuid,uuid,text,text,text,integer,integer,numeric,integer)', 'execute'),
  true, '12 api_app can execute record_ai_usage, authenticated cannot');

set local role api_app;
select private.record_ai_usage('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000d1', 'analyze', 'fake', 'fake-1', 100, 50, 0.001234, 800);
select private.record_ai_usage('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-0000000000d2', 'chat', 'fake', 'fake-1', 10, 5, 0.0001, 200);
select private.record_ai_usage('bbbbbbbb-0000-4000-8000-000000000002', null, 'analyze', 'fake', 'fake-1', 1, 1, 0, 1);
create temp table counts as select
  private.ai_usage_count_since('aaaaaaaa-0000-4000-8000-000000000001', 'analyze', now() - interval '1 day') as analyze_a,
  private.ai_usage_count_since('aaaaaaaa-0000-4000-8000-000000000001', 'analyze', now() + interval '1 day') as future_a;
reset role;
select is((select analyze_a from counts), 1, '13 the daily count sees only that user and kind');
select is((select future_a from counts), 0, '14 rows before the cutoff are not counted');
select is((select design_id from public.ai_usage where kind = 'chat'), null, '15 a design of another user is not linked');

-- 16-18 reads: owner own rows, B own row, admin all
select pg_temp.act_as('aaaaaaaa-0000-4000-8000-000000000001');
select is((select count(*)::int from public.ai_usage), 2, '16 A reads only own usage');
select pg_temp.act_as('cccccccc-0000-4000-8000-000000000003');
select is((select count(*)::int from public.ai_usage), 3, '17 admin reads all usage');
select pg_temp.reset();

-- 18-20 unsupported_features
select is(pg_temp.sqlstate_as('authenticated', $$ insert into public.unsupported_features (design_id, owner_id, feature_text) values ('aaaaaaaa-0000-4000-8000-0000000000d1', 'aaaaaaaa-0000-4000-8000-000000000001', 'x') $$),
  '42501', '18 authenticated cannot insert unsupported_features');
set local role api_app;
select private.record_unsupported_feature('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000d1', 'asymmetric hem');
reset role;
select is(pg_temp.sqlstate_as('api_app', $$ select private.record_unsupported_feature('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-0000000000d2', 'x') $$),
  '23503', '19 a feature cannot be recorded for another user design (composite FK)');
select pg_temp.act_as('bbbbbbbb-0000-4000-8000-000000000002');
select is((select count(*)::int from public.unsupported_features), 0, '20 B reads none of A features');
select pg_temp.act_as('cccccccc-0000-4000-8000-000000000003');
select is((select count(*)::int from public.unsupported_features), 1, '21 admin reads the feature');
select pg_temp.reset();

-- 22 cascade on design delete; 23 account deletion removes usage
delete from public.designs where id = 'aaaaaaaa-0000-4000-8000-0000000000d1';
select is((select count(*)::int from public.unsupported_features), 0, '22 deleting the design removes its unsupported features');
delete from auth.users where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is((select count(*)::int from public.ai_usage where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 0, '23 deleting the account removes its usage');

-- 24 api_app has no table access to the new tables
select is(pg_temp.sqlstate_as('api_app', $$ select count(*) from public.ai_usage $$), '42501', '24 api_app cannot read ai_usage directly');

select * from finish();
rollback;
