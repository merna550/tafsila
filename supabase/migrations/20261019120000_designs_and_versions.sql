-- M3 schema (issue #237, ADR-236 items 2-4): designs and pattern_versions with RLS in this same file.
-- Rule: the database refuses cross-user access even if the API has a bug.

-- ----------------------------------------------------------------- designs
create table public.designs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  category text not null check (category in ('dress', 'skirt', 'blouse')),
  title text not null check (length(title) between 1 and 120),
  photo_paths text[] not null default '{}',
  analysis jsonb,
  -- Foreign key added below, after pattern_versions exists.
  current_version_id uuid,
  created_at timestamptz not null default now(),
  -- The API sets updated_at on every update (there is no trigger).
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);
comment on table public.designs is 'A user design (photos, analysis, current version). Versions live in pattern_versions.';
create index designs_owner_updated_idx on public.designs (owner_id, updated_at desc);

alter table public.designs enable row level security;
revoke all on public.designs from anon, authenticated;
grant select, insert, update, delete on public.designs to authenticated;

create policy designs_owner on public.designs
  for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy designs_admin_read on public.designs
  for select to authenticated using (public.is_admin());

-- -------------------------------------------------------- pattern_versions
create table public.pattern_versions (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null,
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  version_no int not null check (version_no >= 1),
  spec jsonb not null,
  measurement_set_id uuid references public.measurement_sets (id) on delete set null,
  -- Snapshot of the measurements used, so the version stays valid if the set is edited or deleted.
  measurements jsonb not null,
  size_label text,
  ease_profile text not null check (ease_profile in ('fitted', 'regular', 'loose')),
  options jsonb not null default '{}',
  engine_version text not null,
  -- A failing pattern is never stored (ADR-236 item 4).
  validation_status text not null check (validation_status in ('pass', 'warn')),
  input_hash text not null,
  created_by text not null default 'user' check (created_by in ('user', 'chat')),
  created_at timestamptz not null default now(),
  unique (design_id, version_no),
  -- A version can only point at a design of the same owner.
  foreign key (design_id, owner_id) references public.designs (id, owner_id) on delete cascade
);
comment on table public.pattern_versions is 'Append-only versions of a design. input_hash is not unique: the API dedupes against the current version only (a restore may repeat older inputs).';
create index pattern_versions_design_hash_idx on public.pattern_versions (design_id, input_hash);
create index pattern_versions_owner_id_idx on public.pattern_versions (owner_id);

alter table public.pattern_versions enable row level security;
revoke all on public.pattern_versions from anon, authenticated;
-- Append-only: no update or delete privilege (rows go only when the design or the account is deleted).
grant select, insert on public.pattern_versions to authenticated;

create policy pattern_versions_owner on public.pattern_versions
  for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy pattern_versions_admin_read on public.pattern_versions
  for select to authenticated using (public.is_admin());

-- Cycle designs <-> pattern_versions: the pointer is set after the version exists.
alter table public.designs
  add constraint designs_current_version_fk foreign key (current_version_id)
  references public.pattern_versions (id) on delete set null
  deferrable initially deferred;
