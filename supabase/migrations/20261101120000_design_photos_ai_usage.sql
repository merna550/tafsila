-- M6 data (issue #339, ADR-335 item 6): private design photos bucket with owner-only policies, ai_usage and unsupported_features.
-- designs.photo_paths and designs.analysis already exist (20261019120000). Rule: the database refuses cross-user access even if the API has a bug.

-- ------------------------------------------------------------ bucket
-- Hosted environments need the row (supabase/config.toml only creates it locally). HEIC is converted to JPEG in the browser.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('design-photos', 'design-photos', false, 10485760, '{image/jpeg,image/png,image/webp}')
on conflict (id) do nothing;

-- Objects live at <user id>/<design id>/<slot>.<ext>: the first folder is the owner, the second a design the owner has.
create policy design_photos_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'design-photos'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and exists (
      select 1 from public.designs d
      where d.id::text = split_part(name, '/', 2) and d.owner_id = (select auth.uid())
    )
  );
create policy design_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'design-photos'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and exists (
      select 1 from public.designs d
      where d.id::text = split_part(name, '/', 2) and d.owner_id = (select auth.uid())
    )
  );
create policy design_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'design-photos'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and exists (
      select 1 from public.designs d
      where d.id::text = split_part(name, '/', 2) and d.owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------- ai_usage
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  design_id uuid references public.designs (id) on delete set null,
  kind text not null check (kind in ('analyze', 'chat', 'explain')),
  provider text not null,
  model text not null,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  -- An estimate from the provider's price list, not an invoice.
  cost_usd numeric(10, 6) not null default 0 check (cost_usd >= 0),
  latency_ms integer not null default 0 check (latency_ms >= 0),
  created_at timestamptz not null default now()
);
comment on table public.ai_usage is 'One row per AI call (daily caps, cost tracking). Written only by the API role through private.record_ai_usage.';
create index ai_usage_user_created_idx on public.ai_usage (user_id, created_at);

alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;
grant select on public.ai_usage to authenticated;
create policy ai_usage_owner_read on public.ai_usage
  for select to authenticated using (user_id = (select auth.uid()));
create policy ai_usage_admin_read on public.ai_usage
  for select to authenticated using (public.is_admin());

-- -------------------------------------------------- unsupported_features
create table public.unsupported_features (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  feature_text text not null check (length(feature_text) between 1 and 500),
  created_at timestamptz not null default now(),
  -- A feature can only be recorded for a design of the same owner.
  foreign key (design_id, owner_id) references public.designs (id, owner_id) on delete cascade
);
comment on table public.unsupported_features is 'Garment features the analysis saw but the engine cannot draw (product research, FR-DES-07). Written only by the API role.';
create index unsupported_features_design_idx on public.unsupported_features (design_id);

alter table public.unsupported_features enable row level security;
revoke all on public.unsupported_features from anon, authenticated;
grant select on public.unsupported_features to authenticated;
create policy unsupported_features_owner_read on public.unsupported_features
  for select to authenticated using (owner_id = (select auth.uid()));
create policy unsupported_features_admin_read on public.unsupported_features
  for select to authenticated using (public.is_admin());

-- ------------------------------------------------ private write functions
-- api_app holds no table privileges (ADR-035); like the phone functions, these are its only doors to the new tables.
create function private.record_ai_usage(
  p_user_id uuid, p_design_id uuid, p_kind text, p_provider text, p_model text,
  p_input_tokens integer, p_output_tokens integer, p_cost_usd numeric, p_latency_ms integer
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.ai_usage (user_id, design_id, kind, provider, model, input_tokens, output_tokens, cost_usd, latency_ms)
  values (
    p_user_id,
    -- A design that is not the user's is dropped, never linked.
    (select d.id from public.designs d where d.id = p_design_id and d.owner_id = p_user_id),
    p_kind, p_provider, p_model, p_input_tokens, p_output_tokens, p_cost_usd, p_latency_ms
  );
$$;

create function private.ai_usage_count_since(p_user_id uuid, p_kind text, p_since timestamptz)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.ai_usage where user_id = p_user_id and kind = p_kind and created_at >= p_since;
$$;

create function private.record_unsupported_feature(p_owner_id uuid, p_design_id uuid, p_feature_text text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.unsupported_features (design_id, owner_id, feature_text) values (p_design_id, p_owner_id, p_feature_text);
$$;

revoke all on function private.record_ai_usage(uuid, uuid, text, text, text, integer, integer, numeric, integer) from public, anon, authenticated;
revoke all on function private.ai_usage_count_since(uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function private.record_unsupported_feature(uuid, uuid, text) from public, anon, authenticated;
grant execute on function private.record_ai_usage(uuid, uuid, text, text, text, integer, integer, numeric, integer) to api_app, service_role;
grant execute on function private.ai_usage_count_since(uuid, text, timestamptz) to api_app, service_role;
grant execute on function private.record_unsupported_feature(uuid, uuid, text) to api_app, service_role;
