-- M6 fabric explanation cache (issue #346, ADR-335 item 8, decision 346): the AI text that says why the recommended
-- fabrics suit a version, one row per version, language and catalogue state. Owner-only, no admin read (like chat).
-- Rule: the database refuses cross-user access even if the API has a bug.

create table public.fabric_explanations (
  id uuid primary key default gen_random_uuid(),
  pattern_version_id uuid not null,
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  locale text not null check (locale in ('ar', 'en')),
  -- sha-256 of the recommended and avoided fabric ids and reasons: an admin edit of a rule changes it
  catalogue_hash text not null check (length(catalogue_hash) > 0),
  text text not null check (length(text) between 1 and 1000),
  created_at timestamptz not null default now(),
  unique (pattern_version_id, locale, catalogue_hash),
  foreign key (pattern_version_id, owner_id) references public.pattern_versions (id, owner_id) on delete cascade
);
comment on table public.fabric_explanations is 'Cached AI explanation of the fabric recommendations per version, language and catalogue state (FR-REC-04). Written only from the rules'' output.';
create index fabric_explanations_owner_id_idx on public.fabric_explanations (owner_id);

alter table public.fabric_explanations enable row level security;
revoke all on public.fabric_explanations from anon, authenticated;
grant select, insert, delete on public.fabric_explanations to authenticated;

create policy fabric_explanations_owner on public.fabric_explanations
  for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
