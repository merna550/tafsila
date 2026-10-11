-- Local-only database roles, read by the Supabase CLI before migrations.
-- The password is a dev value and is never used on staging or production.
create role api_app login nobypassrls password 'api_app_local_only';
