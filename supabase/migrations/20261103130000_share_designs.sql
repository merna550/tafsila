-- Issue #369 (ADR-365 item 11): design-sharing consent and the admin views of shared designs and unsupported features.
-- Consent is one boolean on profiles with its change time. Admin reads go through private functions (ADR-32a):
-- assert_admin, only the current version's spec, never measurements, clients or notes, and one admin_audit row per call.

alter table public.profiles
  add column share_designs boolean not null default false,
  add column share_designs_changed_at timestamptz;
comment on column public.profiles.share_designs is 'The owner agrees that admins may see the garment specs and photos of their designs (never measurements). Off by default.';
comment on column public.profiles.share_designs_changed_at is 'When share_designs last changed; set by trigger.';

-- The owner may change the consent; every other column stays non-updatable (name and locale were granted before).
grant update (share_designs) on public.profiles to authenticated;

create function public.touch_share_designs_changed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.share_designs is distinct from old.share_designs then
    new.share_designs_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger profiles_share_designs_changed
  before update on public.profiles
  for each row execute function public.touch_share_designs_changed_at();

-- Shared designs: only owners who consented; the spec of the current version; no measurement, client or notes columns.
create function private.admin_shared_designs(p_admin uuid, p_limit integer, p_offset integer)
returns table (
  design_id uuid,
  category text,
  title text,
  current_spec jsonb,
  created_at timestamptz,
  owner_display_name text,
  photo_paths text[],
  total bigint
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform private.assert_admin(p_admin);
  insert into public.admin_audit (who, action, target)
  values (p_admin, 'admin.designs.list', null);
  return query
  select
    d.id,
    d.category,
    d.title,
    v.spec,
    d.created_at,
    p.name,
    d.photo_paths,
    count(*) over ()
  from public.designs d
  join public.profiles p on p.id = d.owner_id and p.share_designs
  join public.pattern_versions v on v.id = d.current_version_id
  order by d.created_at desc, d.id desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0);
end;
$$;

-- Unsupported features: the text and the garment category only, no user id and no design id.
create function private.admin_unsupported_features(p_admin uuid, p_limit integer, p_offset integer)
returns table (
  text text,
  category text,
  created_at timestamptz,
  total bigint
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform private.assert_admin(p_admin);
  insert into public.admin_audit (who, action, target)
  values (p_admin, 'admin.unsupported.list', null);
  return query
  select f.feature_text, d.category, f.created_at, count(*) over ()
  from public.unsupported_features f
  join public.designs d on d.id = f.design_id
  order by f.created_at desc, f.id desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0);
end;
$$;

revoke all on function private.admin_shared_designs(uuid, integer, integer) from public, anon, authenticated;
revoke all on function private.admin_unsupported_features(uuid, integer, integer) from public, anon, authenticated;
grant execute on function private.admin_shared_designs(uuid, integer, integer) to api_app;
grant execute on function private.admin_unsupported_features(uuid, integer, integer) to api_app;

comment on function private.admin_shared_designs(uuid, integer, integer) is 'Admin list of designs whose owner consented: current spec, title, category, photo paths and the owner name. Never measurements, clients or notes. Writes an admin_audit row.';
comment on function private.admin_unsupported_features(uuid, integer, integer) is 'Admin list of unsupported-feature texts with the garment category, without user or design ids. Writes an admin_audit row.';
