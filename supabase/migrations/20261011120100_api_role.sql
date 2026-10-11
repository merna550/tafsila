-- API login role from ADR-035 (issue #24). The API connects as api_app and then runs
-- `set local role authenticated` inside withUser, so RLS applies as the signed-in user.
-- api_app has no table privileges of its own and cannot bypass RLS.
-- Local password: supabase/roles.sql. Staging password: set once from a CI secret, never here.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'api_app') then
    create role api_app login nobypassrls;
  end if;
end
$$;
alter role api_app nobypassrls;
-- SET only (no inherit): api_app can switch to authenticated but holds none of its privileges until it does.
grant authenticated to api_app with inherit false, set true;
