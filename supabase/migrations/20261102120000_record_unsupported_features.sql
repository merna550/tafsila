-- Issue #340: the analysis job records the unsupported features of a design in one call, once per distinct text.
-- Same door as private.record_unsupported_feature (#339): api_app holds no table privileges (ADR-035).
create function private.record_unsupported_features(p_owner_id uuid, p_design_id uuid, p_texts text[])
returns integer
language sql
security definer
set search_path = ''
as $$
  with candidates as (
    select distinct left(btrim(t), 500) as feature_text from unnest(p_texts) as t
  ), inserted as (
    insert into public.unsupported_features (design_id, owner_id, feature_text)
    select p_design_id, p_owner_id, c.feature_text
    from candidates c
    where c.feature_text <> ''
      and exists (select 1 from public.designs d where d.id = p_design_id and d.owner_id = p_owner_id)
      and not exists (
        select 1 from public.unsupported_features f
        where f.design_id = p_design_id and f.owner_id = p_owner_id and f.feature_text = c.feature_text
      )
    returning 1
  )
  select count(*)::integer from inserted;
$$;

revoke all on function private.record_unsupported_features(uuid, uuid, text[]) from public, anon, authenticated;
grant execute on function private.record_unsupported_features(uuid, uuid, text[]) to api_app, service_role;
