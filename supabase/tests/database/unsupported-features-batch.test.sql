-- pgTAP tests for issue #340: private.record_unsupported_features inserts each distinct text once. Run: pnpm db:test
begin;
select plan(5);

insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a@t.test', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b@t.test', 'authenticated', 'authenticated');
insert into public.designs (id, owner_id, category, title) values
  ('aaaaaaaa-0000-4000-8000-0000000000d1', 'aaaaaaaa-0000-4000-8000-000000000001', 'dress', 'A dress');

select is(
  private.record_unsupported_features('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000d1', array['Hood', ' Hood ', 'Peplum', '']),
  2,
  'distinct non-empty texts are inserted once'
);
select is(
  private.record_unsupported_features('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000d1', array['Hood', 'Ruffle']),
  1,
  'a text already stored is not inserted again'
);
select is(
  (select count(*)::int from public.unsupported_features where design_id = 'aaaaaaaa-0000-4000-8000-0000000000d1'),
  3,
  'three rows in total'
);
select is(
  private.record_unsupported_features('bbbbbbbb-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-0000000000d1', array['Other']),
  0,
  'a design that is not the caller''s gets nothing'
);
select is(
  private.record_unsupported_features('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000d1', array[repeat('x', 600)]),
  1,
  'a very long text is cut to 500 characters instead of failing'
);

select * from finish();
rollback;
