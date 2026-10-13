-- Admin functions (issue #32, part A): the users list and the stats the mini admin shows.
-- Why functions: the email and last sign-in live in auth.users and other users' rows are hidden by RLS, so the API
-- reaches them through `private` security-definer functions called as the api_app role (same door as the phone functions).
-- Privacy (NFR-05): an admin sees name, email, phone and a client COUNT, never measurements or client notes.
-- Each function re-checks that the caller is an admin in the database: the role in the token can be up to an hour stale.

create function private.assert_admin(p_admin uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_admin is null or not exists (select 1 from public.profiles where id = p_admin and role = 'admin') then
    raise exception 'admin only' using errcode = '42501';
  end if;
end;
$$;

create function private.admin_users(
  p_admin uuid,
  p_q text,
  p_verified boolean,
  p_limit integer,
  p_offset integer
)
returns table (
  id uuid,
  name text,
  email text,
  phone text,
  phone_verified_at timestamptz,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  client_count integer,
  total bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  pattern text := case
    when coalesce(btrim(p_q), '') = '' then null
    else '%' || replace(replace(replace(btrim(p_q), '\', '\\'), '%', '\%'), '_', '\_') || '%'
  end;
begin
  perform private.assert_admin(p_admin);
  return query
  select
    p.id,
    p.name,
    u.email::text,
    p.phone,
    p.phone_verified_at,
    p.created_at,
    u.last_sign_in_at,
    (select count(*)::integer from public.clients c where c.owner_id = p.id),
    count(*) over ()
  from public.profiles p
  join auth.users u on u.id = p.id
  where (pattern is null or p.name ilike pattern or u.email ilike pattern or p.phone ilike pattern)
    and (p_verified is null or (p.phone_verified_at is not null) = p_verified)
  order by p.created_at desc, p.id desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0);
end;
$$;

create function private.admin_user(p_admin uuid, p_id uuid)
returns table (
  id uuid,
  name text,
  email text,
  phone text,
  phone_verified_at timestamptz,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  client_count integer,
  measurement_set_count integer,
  locale text,
  role text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.assert_admin(p_admin);
  return query
  select
    p.id,
    p.name,
    u.email::text,
    p.phone,
    p.phone_verified_at,
    p.created_at,
    u.last_sign_in_at,
    (select count(*)::integer from public.clients c where c.owner_id = p.id),
    (select count(*)::integer from public.measurement_sets s where s.owner_id = p.id),
    p.locale,
    p.role
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = p_id;
end;
$$;

create function private.admin_stats(p_admin uuid)
returns table (
  users integer,
  verified_phones integer,
  signups_today integer,
  signups_7_days integer,
  clients integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  today_start timestamptz := date_trunc('day', now() at time zone 'Africa/Cairo') at time zone 'Africa/Cairo';
begin
  perform private.assert_admin(p_admin);
  return query
  select
    count(*)::integer,
    (count(*) filter (where p.phone_verified_at is not null))::integer,
    (count(*) filter (where p.created_at >= today_start))::integer,
    (count(*) filter (where p.created_at >= now() - interval '7 days'))::integer,
    (select count(*)::integer from public.clients)
  from public.profiles p;
end;
$$;

revoke all on function private.assert_admin(uuid) from public, anon, authenticated;
revoke all on function private.admin_users(uuid, text, boolean, integer, integer) from public, anon, authenticated;
revoke all on function private.admin_user(uuid, uuid) from public, anon, authenticated;
revoke all on function private.admin_stats(uuid) from public, anon, authenticated;
grant execute on function private.assert_admin(uuid) to api_app, service_role;
grant execute on function private.admin_users(uuid, text, boolean, integer, integer) to api_app, service_role;
grant execute on function private.admin_user(uuid, uuid) to api_app, service_role;
grant execute on function private.admin_stats(uuid) to api_app, service_role;

comment on function private.assert_admin(uuid) is 'Raises 42501 unless the given user is an admin in public.profiles.';
comment on function private.admin_users(uuid, text, boolean, integer, integer) is 'Admin users list: name, email, phone, sign-in dates and a client count (never measurements or notes). Search by name, email or phone.';
comment on function private.admin_user(uuid, uuid) is 'Admin read-only detail of one user: same fields as the list plus counts of clients and measurement sets.';
comment on function private.admin_stats(uuid) is 'Admin dashboard numbers: users, verified phones, sign-ups today (Cairo) and in 7 days, clients.';
