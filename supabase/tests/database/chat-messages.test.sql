-- pgTAP tests for issue #343: chat_messages owner-only RLS, no admin read, cascade. Run: pnpm db:test
begin;
select plan(11);

insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a@t.test', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b@t.test', 'authenticated', 'authenticated'),
  ('cccccccc-0000-4000-8000-000000000003', 'c@t.test', 'authenticated', 'authenticated');
update public.profiles set role = 'admin' where id = 'cccccccc-0000-4000-8000-000000000003';
insert into public.designs (id, owner_id, category, title) values
  ('aaaaaaaa-0000-4000-8000-0000000000d1', 'aaaaaaaa-0000-4000-8000-000000000001', 'dress', 'A dress'),
  ('bbbbbbbb-0000-4000-8000-0000000000d2', 'bbbbbbbb-0000-4000-8000-000000000002', 'skirt', 'B skirt');
insert into public.pattern_versions (id, design_id, owner_id, version_no, spec, measurements, ease_profile, engine_version, validation_status, input_hash)
  values ('aaaaaaaa-0000-4000-8000-0000000000f1', 'aaaaaaaa-0000-4000-8000-0000000000d1', 'aaaaaaaa-0000-4000-8000-000000000001', 1, '{}', '{}', 'regular', '0.16.0', 'pass', 'h1'),
         ('aaaaaaaa-0000-4000-8000-0000000000f2', 'aaaaaaaa-0000-4000-8000-0000000000d1', 'aaaaaaaa-0000-4000-8000-000000000001', 2, '{}', '{}', 'regular', '0.16.0', 'pass', 'h2');

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

-- 1-2 owner inserts a user message and an assistant proposal
select pg_temp.act_as('aaaaaaaa-0000-4000-8000-000000000001');
select lives_ok(
  $$ insert into public.chat_messages (id, design_id, role, content) values ('aaaaaaaa-0000-4000-8000-0000000000a1', 'aaaaaaaa-0000-4000-8000-0000000000d1', 'user', 'add side pockets') $$,
  '1 A inserts a user message');
select lives_ok(
  $$ insert into public.chat_messages (id, design_id, role, content, base_version_id, proposed_patch, changes, outcome)
     values ('aaaaaaaa-0000-4000-8000-0000000000a2', 'aaaaaaaa-0000-4000-8000-0000000000d1', 'assistant', 'Pockets: none to side-seam', 'aaaaaaaa-0000-4000-8000-0000000000f1', '{"ops":[]}', '[{"ar":"x","en":"y"}]', 'proposal') $$,
  '2 A inserts an assistant proposal');
select is((select count(*)::int from public.chat_messages), 2, '3 A reads own messages');

-- 4 only the apply result can be updated
select lives_ok(
  $$ update public.chat_messages set applied_version_id = 'aaaaaaaa-0000-4000-8000-0000000000f2' where id = 'aaaaaaaa-0000-4000-8000-0000000000a2' $$,
  '4 A sets applied_version_id');
select throws_ok($$ update public.chat_messages set content = 'changed' $$, '42501', null, '5 A cannot edit the content');
select throws_ok($$ delete from public.chat_messages $$, '42501', null, '6 A cannot delete messages');

-- 7 a message under another user's design is refused
select throws_ok(
  $$ insert into public.chat_messages (design_id, role, content) values ('bbbbbbbb-0000-4000-8000-0000000000d2', 'user', 'x') $$,
  '23503', null, '7 A cannot write under B design (composite FK)');

-- 8 B sees nothing of A
select pg_temp.act_as('bbbbbbbb-0000-4000-8000-000000000002');
select is((select count(*)::int from public.chat_messages), 0, '8 B reads no message of A');
select throws_ok(
  $$ insert into public.chat_messages (owner_id, design_id, role, content) values ('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000d1', 'user', 'x') $$,
  '42501', null, '9 B cannot insert as A');

-- 10 admin reads no content
select pg_temp.act_as('cccccccc-0000-4000-8000-000000000003');
select is((select count(*)::int from public.chat_messages), 0, '10 admin reads no chat content');

-- 11 design delete cascades
select pg_temp.reset();
delete from public.designs where id = 'aaaaaaaa-0000-4000-8000-0000000000d1';
select is((select count(*)::int from public.chat_messages), 0, '11 deleting a design deletes its messages');

select * from finish();
rollback;
