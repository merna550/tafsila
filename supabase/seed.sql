-- Seed data for local / preview / staging (never production).
-- Accounts and records are documented in docs/backend/seed-data.md.
-- Password for every seed account: Test1234!

-- Seed accounts. The sign-up trigger creates each profile row.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  v.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v.email,
  crypt('Test1234!', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('name', v.name),
  now(), now(), '', '', '', ''
from (values
  ('00000000-0000-4000-8000-000000000001'::uuid, 'trial@tafsila.test', 'Trial User'),
  ('00000000-0000-4000-8000-000000000002'::uuid, 'pro@tafsila.test', 'Pro Workshop'),
  ('00000000-0000-4000-8000-000000000003'::uuid, 'empty@tafsila.test', 'Empty User'),
  ('00000000-0000-4000-8000-000000000004'::uuid, 'admin@tafsila.test', 'Admin User')
) as v (id, email, name);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u
where u.email like '%@tafsila.test';

-- Phone and role are not editable by users, so the seed sets them directly.
update public.profiles set phone = '+201000000001', phone_verified_at = now()
  where id = '00000000-0000-4000-8000-000000000001';
update public.profiles set phone = '+201000000002', phone_verified_at = now()
  where id = '00000000-0000-4000-8000-000000000002';
update public.profiles set phone = '+201000000004', phone_verified_at = now(), role = 'admin'
  where id = '00000000-0000-4000-8000-000000000004';

-- Trial phones for the seeded verified accounts: HMAC-SHA256 with the local PHONE_HASH_SECRET from .env.example,
-- the same bytes the API's hasher produces. Staging has no seed, so its secret never appears here.
insert into public.trial_phones (phone_hash, user_id)
select extensions.hmac(v.phone, 'local-dev-phone-hash-secret-0123456789abcdef', 'sha256'), v.id
from (values
  ('+201000000001', '00000000-0000-4000-8000-000000000001'::uuid),
  ('+201000000002', '00000000-0000-4000-8000-000000000002'::uuid),
  ('+201000000004', '00000000-0000-4000-8000-000000000004'::uuid)
) as v (phone, id);

-- The default size chart comes from the migration 20261013120000_default_size_chart.sql (same on local, CI and staging).

-- Clients and measurement sets (data follows measurementsSchema, size M demo body).
insert into public.clients (id, owner_id, name, notes) values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000000001', 'Client M', 'Seed client'),
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-000000000002', 'Client 1', null),
  ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-000000000002', 'Client 2', null),
  ('00000000-0000-4000-8000-0000000000b3', '00000000-0000-4000-8000-000000000002', 'Client 3', null),
  ('00000000-0000-4000-8000-0000000000b4', '00000000-0000-4000-8000-000000000002', 'Client 4', null),
  ('00000000-0000-4000-8000-0000000000b5', '00000000-0000-4000-8000-000000000002', 'Client 5', null);

insert into public.measurement_sets (owner_id, client_id, label, size_label, data)
select
  c.owner_id, c.id, c.name || ' measurements', 'M',
  '{"unit":"mm","height":1650,"bust":920,"highBust":860,"underBust":780,"waist":740,"hip":1000,"hipDepth":200,"neck":360,"shoulderWidth":380,"backLength":400,"frontLength":430,"bustPointDistance":190,"bustHeight":250,"armLength":590,"upperArm":290,"wrist":160,"waistToKnee":580,"waistToFloor":1050}'::jsonb
from public.clients c;
