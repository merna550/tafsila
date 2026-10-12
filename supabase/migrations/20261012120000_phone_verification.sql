-- Phone verification and one free trial per phone number (issue #26, part A; decision docs/decisions/26-phone-otp-trial.md).
-- Only the API (login role api_app) and the service role can touch this: the tables have no policies and no grants for
-- anon/authenticated, and the functions live in a `private` schema that PostgREST does not expose.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to api_app, service_role;

-- ------------------------------------------------------------- trial_phones
-- One row per phone number ever verified, kept after the account is deleted so a number cannot get a second trial.
-- Only a keyed hash (HMAC-SHA256 with PHONE_HASH_SECRET, held by the API) is stored, never the number.
create table public.trial_phones (
  phone_hash bytea primary key,
  user_id uuid references auth.users (id) on delete set null,
  first_verified_at timestamptz not null default now(),
  trial_granted_at timestamptz
);
comment on table public.trial_phones is 'Keyed hashes of verified phone numbers. user_id is nulled when the account is deleted; the row stays so the trial is not granted twice.';
comment on column public.trial_phones.trial_granted_at is 'Set by the billing code (M7) in the same transaction as the trial credits.';
create index trial_phones_user_id_idx on public.trial_phones (user_id);

-- -------------------------------------------------------- phone_otp_events
-- Sends and wrong codes, used by private.phone_otp_attempt for rate limits. Rows older than 24 hours are deleted on each call.
create table public.phone_otp_events (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('send', 'verify_fail')),
  user_id uuid references auth.users (id) on delete cascade,
  phone_hash bytea not null,
  ip_hash bytea,
  created_at timestamptz not null default now()
);
comment on table public.phone_otp_events is 'Rate-limit events for phone verification: hashes only, no phone or IP in clear text. Purged after 24 hours.';
create index phone_otp_events_user_idx on public.phone_otp_events (kind, user_id, created_at);
create index phone_otp_events_phone_idx on public.phone_otp_events (kind, phone_hash, created_at);
create index phone_otp_events_ip_idx on public.phone_otp_events (kind, ip_hash, created_at);
create index phone_otp_events_created_idx on public.phone_otp_events (created_at);

alter table public.trial_phones enable row level security;
alter table public.phone_otp_events enable row level security;
revoke all on public.trial_phones from anon, authenticated;
revoke all on public.phone_otp_events from anon, authenticated;
-- No policies on purpose: nobody but the table owner (the private functions) and the service role reads or writes these.

comment on column public.profiles.phone_verified_at is 'Written only by private.confirm_phone (issue #26). Users cannot update it.';

-- --------------------------------------------------------- private.phone_status
-- What the API needs before sending a code and for GET /api/phone. p_e164 and p_phone_hash may be null (status only).
create function private.phone_status(p_user_id uuid, p_e164 text default null, p_phone_hash bytea default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_profile record;
  v_number text;
begin
  select p.phone, p.phone_verified_at into v_profile from public.profiles p where p.id = p_user_id;
  if p_phone_hash is not null then
    if exists (select 1 from public.trial_phones t where t.phone_hash = p_phone_hash and t.user_id = p_user_id) then
      v_number := 'own';
    elsif exists (select 1 from public.trial_phones t where t.phone_hash = p_phone_hash)
       or exists (select 1 from public.profiles p where p.phone = p_e164 and p.id <> p_user_id) then
      v_number := 'taken';
    else
      v_number := 'free';
    end if;
  end if;
  return jsonb_build_object(
    'verified', v_profile.phone_verified_at is not null,
    'phone', case when v_profile.phone_verified_at is not null then v_profile.phone end,
    'trial_eligible', private.is_trial_eligible(p_user_id),
    'number', v_number
  );
end;
$$;

-- ----------------------------------------------------- private.is_trial_eligible
-- Verified, the trial_phones row belongs to this user and the trial was not granted yet.
create function private.is_trial_eligible(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.trial_phones t on t.user_id = p.id
    where p.id = p_user_id and p.phone_verified_at is not null and t.trial_granted_at is null
  );
$$;

-- -------------------------------------------------- private.phone_otp_attempt
-- Counts events per scope and window, refuses when any rule is full, and records the event when asked.
-- p_limits: [{"scope":"account"|"number"|"ip","window_seconds":60,"max":1}, ...]. Everything runs under one advisory lock,
-- so two parallel requests cannot both pass the same limit.
create function private.phone_otp_attempt(
  p_kind text, p_user_id uuid, p_phone_hash bytea, p_ip_hash bytea, p_limits jsonb, p_record boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_rule jsonb;
  v_scope text;
  v_window int;
  v_count int;
  v_oldest timestamptz;
  v_retry int;
  v_worst int := 0;
  v_worst_scope text;
  v_worst_window int;
  v_prior int;
begin
  if p_kind not in ('send', 'verify_fail') then
    raise exception 'invalid kind' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('phone_otp', 0));
  delete from public.phone_otp_events where created_at < v_now - interval '24 hours';

  select count(*) into v_prior from public.phone_otp_events e where e.kind = p_kind and e.user_id = p_user_id;

  for v_rule in select * from jsonb_array_elements(p_limits) loop
    v_scope := v_rule ->> 'scope';
    v_window := (v_rule ->> 'window_seconds')::int;
    select count(*), min(e.created_at) into v_count, v_oldest
    from public.phone_otp_events e
    where e.kind = p_kind
      and e.created_at > v_now - make_interval(secs => v_window)
      and case v_scope
            when 'account' then e.user_id = p_user_id
            when 'number' then e.phone_hash = p_phone_hash
            when 'ip' then p_ip_hash is not null and e.ip_hash = p_ip_hash
            else false
          end;
    if v_count >= (v_rule ->> 'max')::int then
      v_retry := greatest(1, ceil(extract(epoch from (v_oldest + make_interval(secs => v_window) - v_now)))::int);
      if v_retry > v_worst then
        v_worst := v_retry;
        v_worst_scope := v_scope;
        v_worst_window := v_window;
      end if;
    end if;
  end loop;

  if v_worst > 0 then
    return jsonb_build_object('allowed', false, 'retry_after_seconds', v_worst,
                              'scope', v_worst_scope, 'window_seconds', v_worst_window,
                              'prior_events', v_prior);
  end if;
  if p_record then
    insert into public.phone_otp_events (kind, user_id, phone_hash, ip_hash)
    values (p_kind, p_user_id, p_phone_hash, p_ip_hash);
  end if;
  return jsonb_build_object('allowed', true, 'retry_after_seconds', 0, 'scope', null, 'window_seconds', null,
                            'prior_events', v_prior);
end;
$$;

-- ------------------------------------------------------- private.confirm_phone
-- The only writer of profiles.phone_verified_at. Raises PH001 phone_already_used or PH002 phone_already_verified.
create function private.confirm_phone(p_user_id uuid, p_e164 text, p_phone_hash bytea)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_verified timestamptz;
  v_now timestamptz := now();
begin
  -- Serialises accounts racing for the same number; the primary key on trial_phones is the last guard.
  perform pg_advisory_xact_lock(hashtextextended(encode(p_phone_hash, 'hex'), 0));
  select p.phone_verified_at into v_verified from public.profiles p where p.id = p_user_id for update;
  if not found then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;
  if v_verified is not null then
    raise exception 'phone_already_verified' using errcode = 'PH002';
  end if;
  if exists (select 1 from public.trial_phones t where t.phone_hash = p_phone_hash)
     or exists (select 1 from public.profiles p where p.phone = p_e164 and p.id <> p_user_id) then
    raise exception 'phone_already_used' using errcode = 'PH001';
  end if;
  update public.profiles set phone = p_e164, phone_verified_at = v_now where id = p_user_id;
  insert into public.trial_phones (phone_hash, user_id, first_verified_at) values (p_phone_hash, p_user_id, v_now);
  return jsonb_build_object('verified_at', v_now, 'trial_eligible', true);
end;
$$;

-- Only the API role and the service role may call the private functions.
revoke all on function private.phone_status(uuid, text, bytea) from public, anon, authenticated;
revoke all on function private.is_trial_eligible(uuid) from public, anon, authenticated;
revoke all on function private.phone_otp_attempt(text, uuid, bytea, bytea, jsonb, boolean) from public, anon, authenticated;
revoke all on function private.confirm_phone(uuid, text, bytea) from public, anon, authenticated;
grant execute on function private.phone_status(uuid, text, bytea) to api_app, service_role;
grant execute on function private.is_trial_eligible(uuid) to api_app, service_role;
grant execute on function private.phone_otp_attempt(text, uuid, bytea, bytea, jsonb, boolean) to api_app, service_role;
grant execute on function private.confirm_phone(uuid, text, bytea) to api_app, service_role;
