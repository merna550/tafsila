-- pgTAP tests for issue #91: the custom access token hook adds user_role. Run: pnpm db:test
begin;
select plan(6);

insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000011', 'u@t.test', 'authenticated', 'authenticated'),
  ('cccccccc-0000-4000-8000-000000000013', 'adm@t.test', 'authenticated', 'authenticated');
update public.profiles set role = 'admin' where id = 'cccccccc-0000-4000-8000-000000000013';

select is(
  (public.custom_access_token_hook(
    '{"user_id":"aaaaaaaa-0000-4000-8000-000000000011","claims":{"sub":"x"}}'::jsonb) -> 'claims' ->> 'user_role'),
  'user', '1 an ordinary user gets user_role user');
select is(
  (public.custom_access_token_hook(
    '{"user_id":"cccccccc-0000-4000-8000-000000000013","claims":{}}'::jsonb) -> 'claims' ->> 'user_role'),
  'admin', '2 an admin gets user_role admin');
select is(
  (public.custom_access_token_hook(
    '{"user_id":"dddddddd-0000-4000-8000-000000000099","claims":{}}'::jsonb) -> 'claims' ->> 'user_role'),
  'user', '3 an unknown user defaults to user');
select is(
  (public.custom_access_token_hook(
    '{"user_id":"aaaaaaaa-0000-4000-8000-000000000011","claims":{"sub":"x"}}'::jsonb) -> 'claims' ->> 'sub'),
  'x', '4 existing claims are kept');

select ok(has_function_privilege('supabase_auth_admin', 'public.custom_access_token_hook(jsonb)', 'execute'),
  '5 supabase_auth_admin can execute the hook');
select ok(
  not has_function_privilege('authenticated', 'public.custom_access_token_hook(jsonb)', 'execute')
  and not has_function_privilege('anon', 'public.custom_access_token_hook(jsonb)', 'execute'),
  '6 authenticated and anon cannot execute the hook');

select * from finish();
rollback;
