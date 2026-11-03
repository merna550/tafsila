-- pgTAP tests for issue #370: the trial grant, credit_lots / credit_balance / credit_summary and plan_limits. Run: pnpm db:test
begin;
select plan(22);

insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-0000-4000-8000-000000000a70', 'ta@t.test', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000b70', 'tb@t.test', 'authenticated', 'authenticated'),
  ('cccccccc-0000-4000-8000-000000000c70', 'tc@t.test', 'authenticated', 'authenticated'),
  ('dddddddd-0000-4000-8000-000000000d70', 'td@t.test', 'authenticated', 'authenticated');

-- A and B verify (different numbers); C stays unverified.
select private.confirm_phone('aaaaaaaa-0000-4000-8000-000000000a70', '+201000007001', '\x7001');
select private.confirm_phone('bbbbbbbb-0000-4000-8000-000000000b70', '+201000007002', '\x7002');

-- grant_trial
select is(private.grant_trial('aaaaaaaa-0000-4000-8000-000000000a70', 3), true, '1 first call grants the trial');
select is(private.grant_trial('aaaaaaaa-0000-4000-8000-000000000a70', 3), false, '2 second call grants nothing');
select is((select count(*)::int from public.credit_ledger where user_id = 'aaaaaaaa-0000-4000-8000-000000000a70' and reason = 'trial'), 1, '3 one ledger row');
select isnt((select trial_granted_at from public.trial_phones where user_id = 'aaaaaaaa-0000-4000-8000-000000000a70'), null, '4 trial_granted_at is set');
select is(private.credit_balance('aaaaaaaa-0000-4000-8000-000000000a70'), 3, '5 balance is 3');
select is(private.grant_trial('cccccccc-0000-4000-8000-000000000c70', 3), false, '6 an unverified user gets nothing');
select is(private.credit_balance('cccccccc-0000-4000-8000-000000000c70'), 0, '7 and has no credits');

-- A deleted account's number cannot be verified again, so no second trial.
delete from auth.users where id = 'bbbbbbbb-0000-4000-8000-000000000b70';
select throws_ok($$select private.confirm_phone('dddddddd-0000-4000-8000-000000000d70', '+201000007002', '\x7002')$$,
  'PH001', null, '8 the same number on a new account fails with PH001');
select is(private.grant_trial('dddddddd-0000-4000-8000-000000000d70', 3), false, '9 and the new account gets no trial');

-- credit_lots / credit_summary: A has the trial lot (3, one spent), an expired pack and a pack that expires in 10 days.
select private.consume_credit('aaaaaaaa-0000-4000-8000-000000000a70', 'e0000000-0000-4000-8000-000000000070');
insert into public.credit_ledger (user_id, delta, reason, ref_id, expires_at, created_at) values
  ('aaaaaaaa-0000-4000-8000-000000000a70', 4, 'purchase', 'old-70', now() - interval '1 day', now() - interval '40 days');
select private.grant_credits('aaaaaaaa-0000-4000-8000-000000000a70', 5, 'purchase', 'pay-70', now() + interval '10 days');
select is((select count(*)::int from private.credit_lots('aaaaaaaa-0000-4000-8000-000000000a70')), 2, '10 two lots with credits left (expired one ignored)');
select is(private.credit_balance('aaaaaaaa-0000-4000-8000-000000000a70'),
  (select sum(remaining)::int from private.credit_lots('aaaaaaaa-0000-4000-8000-000000000a70')), '11 balance equals the sum of the lots');
-- The one-credit debit above drew from the pack (expires first) only if it existed then; here it drew from the trial lot.
select is(private.credit_summary('aaaaaaaa-0000-4000-8000-000000000a70')->>'balance', '7', '12 summary balance is 2 + 5');
select is(jsonb_array_length(private.credit_summary('aaaaaaaa-0000-4000-8000-000000000a70')->'lots'), 2, '13 summary lists two lots');
select is(private.credit_summary('aaaaaaaa-0000-4000-8000-000000000a70')->'lots'->0->>'remaining', '5', '14 the lot that expires first is listed first');
select is(private.credit_summary('aaaaaaaa-0000-4000-8000-000000000a70')->'plan', 'null'::jsonb, '15 no plan is null');

-- Plans
insert into public.subscriptions (user_id, product_code, status, current_period_end) values
  ('aaaaaaaa-0000-4000-8000-000000000a70', 'pro', 'active', now() + interval '5 days');
select is(private.credit_summary('aaaaaaaa-0000-4000-8000-000000000a70')->'plan'->>'code', 'pro', '16 an active plan is in the summary');
select is((select count(*)::int from private.plan_limits('aaaaaaaa-0000-4000-8000-000000000a70') where max_clients is null and chat_per_design = 20), 1, '17 pro limits: unlimited clients, 20 chat messages');
update public.subscriptions set current_period_end = now() - interval '1 minute' where user_id = 'aaaaaaaa-0000-4000-8000-000000000a70';
select is(private.credit_summary('aaaaaaaa-0000-4000-8000-000000000a70')->'plan', 'null'::jsonb, '18 a plan past its period end is null');
select is((select count(*)::int from private.plan_limits('aaaaaaaa-0000-4000-8000-000000000a70')), 0, '19 and has no limits row');

-- Privileges
select is(has_function_privilege('authenticated', 'private.grant_trial(uuid,integer)', 'execute')
       or has_function_privilege('authenticated', 'private.credit_summary(uuid)', 'execute')
       or has_function_privilege('authenticated', 'private.credit_lots(uuid)', 'execute')
       or has_function_privilege('authenticated', 'private.plan_limits(uuid)', 'execute'), false, '20 authenticated cannot execute them');
select is(has_function_privilege('anon', 'private.grant_trial(uuid,integer)', 'execute'), false, '21 anon cannot execute grant_trial');
select is(has_function_privilege('api_app', 'private.grant_trial(uuid,integer)', 'execute')
      and has_function_privilege('api_app', 'private.credit_summary(uuid)', 'execute')
      and has_function_privilege('api_app', 'private.plan_limits(uuid)', 'execute')
      and has_function_privilege('api_app', 'private.credit_lots(uuid)', 'execute'), true, '22 api_app can execute them');

select * from finish();
rollback;
