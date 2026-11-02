-- M6 chat edits (issue #343, ADR-335 items 3-4, decision 343): chat_messages with owner-only RLS.
-- Rule: the database refuses cross-user access even if the API has a bug. Admins get NO policy: chat content is private (counts only, via a function later if needed).

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  -- Insertion order inside one design (a user message and its answer are inserted together).
  seq bigint generated always as identity,
  design_id uuid not null,
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (length(content) between 1 and 2000),
  -- The version the proposal was made against; applying after the design moved is refused (stale).
  base_version_id uuid references public.pattern_versions (id) on delete set null,
  proposed_patch jsonb,
  -- Bilingual summary lines [{ar, en}]; for an `unsupported` answer, the closest supported changes.
  changes jsonb not null default '[]',
  outcome text not null default 'none' check (outcome in ('proposal', 'unsupported', 'none')),
  applied_version_id uuid references public.pattern_versions (id) on delete set null,
  created_at timestamptz not null default now(),
  -- A message can only belong to a design of the same owner.
  foreign key (design_id, owner_id) references public.designs (id, owner_id) on delete cascade
);
comment on table public.chat_messages is 'Chat edit history of a design: user messages and the assistant proposals (patch + summary). Owner only; no admin read.';
create index chat_messages_design_seq_idx on public.chat_messages (design_id, seq);
create index chat_messages_owner_id_idx on public.chat_messages (owner_id);

alter table public.chat_messages enable row level security;
revoke all on public.chat_messages from anon, authenticated;
-- Messages are never edited or deleted by users (they go with the design or the account); only the apply result is written back.
grant select, insert on public.chat_messages to authenticated;
grant update (applied_version_id) on public.chat_messages to authenticated;

create policy chat_messages_owner on public.chat_messages
  for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
