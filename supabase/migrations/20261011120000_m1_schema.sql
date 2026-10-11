-- M1 schema (issue #24, SRS section 7): profiles, clients, measurement_sets,
-- size_charts, admin_audit. Every table has Row Level Security in this same file.
-- Rule: the database refuses cross-user access even if the API has a bug.

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  phone text,
  phone_verified_at timestamptz,
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);
comment on table public.profiles is 'One row per auth user. role and phone_verified_at are changed only by the service role.';

create unique index profiles_phone_key on public.profiles (phone) where phone is not null;

-- Admin check used by policies. Security definer so it does not recurse into profiles RLS.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- Creates the profile row when somebody signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, locale) on public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ----------------------------------------------------------------- clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (id, owner_id)
);
create index clients_owner_id_idx on public.clients (owner_id);

alter table public.clients enable row level security;
revoke all on public.clients from anon, authenticated;
grant select, insert, update, delete on public.clients to authenticated;

create policy clients_owner on public.clients
  for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- -------------------------------------------------------- measurement_sets
create table public.measurement_sets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  client_id uuid,
  label text not null,
  size_label text,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  -- A set can only point at a client of the same owner.
  foreign key (client_id, owner_id) references public.clients (id, owner_id) on delete cascade
);
create index measurement_sets_owner_id_idx on public.measurement_sets (owner_id);
create index measurement_sets_client_id_idx on public.measurement_sets (client_id);

alter table public.measurement_sets enable row level security;
revoke all on public.measurement_sets from anon, authenticated;
grant select, insert, update, delete on public.measurement_sets to authenticated;

create policy measurement_sets_owner on public.measurement_sets
  for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

--------------------------------------------------------------- size_charts
create table public.size_charts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sizes jsonb not null check (jsonb_typeof(sizes) = 'object'),
  is_default boolean not null default false,
  -- null = system chart; set = a user's private chart (Pro feature after launch, no UI yet)
  owner_id uuid references public.profiles (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);
create unique index size_charts_one_default_system_idx
  on public.size_charts (is_default) where is_default and owner_id is null;
create index size_charts_owner_id_idx on public.size_charts (owner_id);

alter table public.size_charts enable row level security;
revoke all on public.size_charts from anon, authenticated;
grant select on public.size_charts to anon;
grant select, insert, update, delete on public.size_charts to authenticated;

create policy size_charts_read on public.size_charts
  for select to anon, authenticated
  using (owner_id is null or owner_id = (select auth.uid()));
create policy size_charts_own_write on public.size_charts
  for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy size_charts_admin_write on public.size_charts
  for all to authenticated
  using (owner_id is null and public.is_admin())
  with check (owner_id is null and public.is_admin());

-- ------------------------------------------------------------- admin_audit
create table public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  who uuid references auth.users (id) on delete set null,
  action text not null,
  target text,
  before jsonb,
  after jsonb,
  at timestamptz not null default now()
);
create index admin_audit_at_idx on public.admin_audit (at desc);

alter table public.admin_audit enable row level security;
revoke all on public.admin_audit from anon, authenticated;
-- Append-only: no update or delete privilege for anyone but the service role.
grant select, insert on public.admin_audit to authenticated;

create policy admin_audit_select on public.admin_audit
  for select to authenticated using (public.is_admin());
create policy admin_audit_insert on public.admin_audit
  for insert to authenticated
  with check (public.is_admin() and who = (select auth.uid()));
