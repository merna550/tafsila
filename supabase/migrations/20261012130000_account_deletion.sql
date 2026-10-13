-- Account deletion (issue #27, part A): one function that records the deletion in admin_audit after the user is gone.
-- admin_audit only lets admins insert, and the deleted user cannot insert for themselves, so the API role calls this
-- function. The row holds no user id, no email and no name (NFR-05, Egypt Law 151/2020).

create function private.record_account_deleted()
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.admin_audit (who, action) values (null, 'account.deleted');
$$;

revoke all on function private.record_account_deleted() from public, anon, authenticated;
grant execute on function private.record_account_deleted() to api_app, service_role;

comment on function private.record_account_deleted() is 'Adds one anonymous account.deleted row to admin_audit. Called by the API after the auth user is deleted.';
