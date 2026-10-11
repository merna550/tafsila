-- Custom access token hook (issue #91, plan #25 decision 4): Supabase Auth calls this function before it
-- signs an access token and we add `user_role` from profiles.role. The API reads the claim in requireAuth,
-- so it needs no database query per request. A role change shows up at the next token refresh (1 hour at most).
create function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  claims jsonb;
  found_role text;
begin
  select p.role into found_role from public.profiles p where p.id = (event ->> 'user_id')::uuid;
  claims := coalesce(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{user_role}', to_jsonb(coalesce(found_role, 'user')));
  return jsonb_set(event, '{claims}', claims);
end;
$$;
comment on function public.custom_access_token_hook(jsonb) is 'Adds user_role (from profiles.role, default user) to the access token. Called only by Supabase Auth.';

-- Only the Auth service may call it: nobody else can learn another user's role through the Data API.
revoke all on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
