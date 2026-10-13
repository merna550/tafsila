-- pgTAP tests for issue #31: the default system size chart from the migration. Run: pnpm db:test
begin;
select plan(4);

select is((select count(*)::int from public.size_charts where is_default and owner_id is null), 1, '1 one default system chart exists');
select is((select array_agg(k order by k) from public.size_charts, jsonb_object_keys(sizes) k where is_default),
  array['L', 'M', 'S', 'XL', 'XXL'], '2 it has sizes S, M, L, XL, XXL');
select is((select count(*)::int from public.size_charts, jsonb_each(sizes) e, jsonb_object_keys(e.value) k
  where is_default and k <> 'unit'), 90, '3 every size has all 18 measurements');

set local role authenticated;
select is((select count(*)::int from public.size_charts where is_default), 1, '4 authenticated users can read it');

select * from finish();
rollback;
