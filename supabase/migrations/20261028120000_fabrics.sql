-- M5 fabric tables (issue #317, ADR-312 items 5-6): fabrics and fabric_rules (catalogue, admin-edited) and fabric_calcs
-- (the last calculation per version and options, owner-only). RLS in this same file.
-- Rule: the database refuses cross-user access even if the API has a bug.
-- The seed at the end is generated from packages/fabric-kb (src/seed-sql.ts); a test fails when the two drift.

-- ----------------------------------------------------------------- fabrics
create table public.fabrics (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_ar text not null check (length(name_ar) > 0),
  name_en text not null check (length(name_en) > 0),
  -- drape, weight, body, stretch, sheen as integers 0 to 4 (ADR-314)
  properties jsonb not null check (jsonb_typeof(properties) = 'object'),
  care_notes jsonb not null check (jsonb_typeof(care_notes) = 'object'),
  -- true until Merna reviews the row; the UI shows "draft" while any used row is true
  is_draft boolean not null default true,
  created_at timestamptz not null default now(),
  -- The API sets updated_at on every update (there is no trigger).
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
comment on table public.fabrics is 'Fabric catalogue (FR-REC-02). Read by every signed-in user, written by admins only; ids are the package slugs.';

alter table public.fabrics enable row level security;
revoke all on public.fabrics from anon, authenticated;
grant select, insert, update, delete on public.fabrics to authenticated;

create policy fabrics_read on public.fabrics
  for select to authenticated using (true);
create policy fabrics_admin_write on public.fabrics
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------ fabric_rules
create table public.fabric_rules (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- list of path/op/values tests over the DesignSpec (the package's `when`)
  condition jsonb not null check (jsonb_typeof(condition) = 'array'),
  -- property, min, max and strength prefer/must (the package's `effect`)
  required_properties jsonb not null check (jsonb_typeof(required_properties) = 'object'),
  priority smallint not null check (priority between 1 and 5),
  reason jsonb not null check (jsonb_typeof(reason) = 'object'),
  is_draft boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
comment on table public.fabric_rules is 'Recommendation rules (FR-REC-01..03): DesignSpec conditions to fabric property ranges. Read by every signed-in user, written by admins only.';

alter table public.fabric_rules enable row level security;
revoke all on public.fabric_rules from anon, authenticated;
grant select, insert, update, delete on public.fabric_rules to authenticated;

create policy fabric_rules_read on public.fabric_rules
  for select to authenticated using (true);
create policy fabric_rules_admin_write on public.fabric_rules
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------- fabric_calcs
-- A version can only be pointed at by a calculation of the same owner (composite foreign key, like pattern_versions).
alter table public.pattern_versions add constraint pattern_versions_id_owner_key unique (id, owner_id);

create table public.fabric_calcs (
  id uuid primary key default gen_random_uuid(),
  pattern_version_id uuid not null,
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  options jsonb not null,
  -- sha-256 of the canonical options: one row per version and options
  options_hash text not null,
  -- length to buy and placements per fabric kind
  result jsonb not null,
  nesting_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pattern_version_id, options_hash),
  foreign key (pattern_version_id, owner_id) references public.pattern_versions (id, owner_id) on delete cascade
);
comment on table public.fabric_calcs is 'Last fabric calculation per version and options (ADR-312 item 5). The browser computes, the API validates the shape.';
create index fabric_calcs_owner_id_idx on public.fabric_calcs (owner_id);

alter table public.fabric_calcs enable row level security;
revoke all on public.fabric_calcs from anon, authenticated;
grant select, insert, update, delete on public.fabric_calcs to authenticated;

create policy fabric_calcs_owner on public.fabric_calcs
  for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy fabric_calcs_admin_read on public.fabric_calcs
  for select to authenticated using (public.is_admin());

-- -------------------------------------------------------------------- seed
insert into public.fabrics (id, name_ar, name_en, properties, care_notes, is_draft)
values
  ('crepe', 'كريب', 'Crepe', '{"drape":3,"weight":2,"body":2,"sheen":1,"stretch":0}'::jsonb, '{"ar":"غسيل لطيف على 30 درجة، كي على حرارة متوسطة","en":"Gentle wash at 30 degrees, medium iron"}'::jsonb, true),
  ('chiffon', 'شيفون', 'Chiffon', '{"drape":4,"weight":0,"body":0,"sheen":2,"stretch":0}'::jsonb, '{"ar":"غسيل يدوي، كي على حرارة منخفضة","en":"Hand wash, low iron"}'::jsonb, true),
  ('georgette', 'جورجيت', 'Georgette', '{"drape":4,"weight":1,"body":1,"sheen":1,"stretch":0}'::jsonb, '{"ar":"غسيل يدوي لطيف، كي على حرارة منخفضة","en":"Gentle hand wash, low iron"}'::jsonb, true),
  ('satin', 'ستان', 'Satin', '{"drape":3,"weight":2,"body":1,"sheen":4,"stretch":0}'::jsonb, '{"ar":"غسيل لطيف، كي من الخلف على حرارة منخفضة","en":"Gentle wash, iron on the back at low heat"}'::jsonb, true),
  ('linen', 'كتان', 'Linen', '{"drape":1,"weight":2,"body":3,"sheen":0,"stretch":0}'::jsonb, '{"ar":"غسيل على 40 درجة، يكوى وهو مبلل","en":"Wash at 40 degrees, iron while damp"}'::jsonb, true),
  ('cotton-poplin', 'قطن بوبلين', 'Cotton poplin', '{"drape":1,"weight":2,"body":3,"sheen":1,"stretch":0}'::jsonb, '{"ar":"غسيل على 40 درجة، كي على حرارة عالية","en":"Wash at 40 degrees, hot iron"}'::jsonb, true),
  ('viscose', 'فسكوز', 'Viscose', '{"drape":4,"weight":1,"body":0,"sheen":1,"stretch":0}'::jsonb, '{"ar":"غسيل لطيف وقد ينكمش، كي على حرارة متوسطة","en":"Gentle wash, may shrink, medium iron"}'::jsonb, true),
  ('taffeta', 'تافتا', 'Taffeta', '{"drape":0,"weight":2,"body":4,"sheen":3,"stretch":0}'::jsonb, '{"ar":"تنظيف جاف أو غسيل يدوي، كي على حرارة منخفضة","en":"Dry clean or hand wash, low iron"}'::jsonb, true),
  ('lace', 'دانتيل', 'Lace', '{"drape":2,"weight":1,"body":2,"sheen":1,"stretch":0}'::jsonb, '{"ar":"غسيل يدوي، بدون عصر، يفرد ليجف","en":"Hand wash, do not wring, dry flat"}'::jsonb, true),
  ('velvet', 'مخمل', 'Velvet', '{"drape":3,"weight":3,"body":2,"sheen":3,"stretch":0}'::jsonb, '{"ar":"تنظيف جاف، لا يكوى على الوجه","en":"Dry clean, never iron the pile side"}'::jsonb, true),
  ('jacquard', 'جاكار', 'Jacquard', '{"drape":1,"weight":3,"body":4,"sheen":2,"stretch":0}'::jsonb, '{"ar":"تنظيف جاف أو غسيل يدوي","en":"Dry clean or hand wash"}'::jsonb, true),
  ('tulle', 'تل', 'Tulle', '{"drape":1,"weight":0,"body":2,"sheen":1,"stretch":0}'::jsonb, '{"ar":"غسيل يدوي، يحتاج حرصا عند الكي","en":"Hand wash, iron with great care"}'::jsonb, true),
  ('printed-cotton', 'قطن مطبوع', 'Printed cotton', '{"drape":1,"weight":1,"body":2,"sheen":0,"stretch":0}'::jsonb, '{"ar":"غسيل على 40 درجة، كي على حرارة عالية","en":"Wash at 40 degrees, hot iron"}'::jsonb, true),
  ('crepe-satin', 'كريب ساتان', 'Crepe satin', '{"drape":3,"weight":2,"body":1,"sheen":3,"stretch":0}'::jsonb, '{"ar":"غسيل لطيف، كي من الخلف على حرارة منخفضة","en":"Gentle wash, iron on the back at low heat"}'::jsonb, true),
  ('linen-blend', 'لينن مخلوط', 'Linen blend', '{"drape":2,"weight":2,"body":2,"sheen":0,"stretch":0}'::jsonb, '{"ar":"غسيل على 30 درجة، كي على حرارة متوسطة","en":"Wash at 30 degrees, medium iron"}'::jsonb, true),
  ('heavy-polyester', 'بوليستر ثقيل', 'Heavy polyester', '{"drape":2,"weight":3,"body":3,"sheen":2,"stretch":0}'::jsonb, '{"ar":"غسيل على 30 درجة، كي على حرارة منخفضة","en":"Wash at 30 degrees, low iron"}'::jsonb, true)
on conflict (id) do nothing;

insert into public.fabric_rules (id, condition, required_properties, priority, reason, is_draft)
values
  ('circle-skirt-drape', '[{"path":"skirt.type","op":"in","values":["circle-half","circle-full"]}]'::jsonb, '{"property":"drape","min":2,"strength":"must"}'::jsonb, 5, '{"ar":"التنورة الدائرية تحتاج خامة سائبة الوقعة لتنسدل في طيات ناعمة","en":"A circle skirt needs a fabric that drapes so it falls in soft folds"}'::jsonb, true),
  ('circle-skirt-light', '[{"path":"skirt.type","op":"in","values":["circle-half","circle-full"]}]'::jsonb, '{"property":"weight","max":2,"strength":"prefer"}'::jsonb, 3, '{"ar":"الخامة الخفيفة تحافظ على استدارة التنورة دون أن تسحبها للأسفل","en":"A light fabric keeps a circle skirt flaring without dragging it down"}'::jsonb, true),
  ('gathered-skirt-drape', '[{"path":"skirt.type","op":"in","values":["gathered","tiered"]}]'::jsonb, '{"property":"drape","min":2,"strength":"prefer"}'::jsonb, 4, '{"ar":"الكشكش يبدو أجمل في خامة ناعمة تنسدل","en":"Gathers look best in a soft fabric that falls well"}'::jsonb, true),
  ('gathered-skirt-bulk', '[{"path":"skirt.type","op":"in","values":["gathered"]}]'::jsonb, '{"property":"weight","max":2,"strength":"must"}'::jsonb, 3, '{"ar":"الخامة الثقيلة تعمل سماكة كبيرة عند الخصر مع الكشكش","en":"A heavy fabric makes the gathers bulky at the waist"}'::jsonb, true),
  ('tiered-skirt-light', '[{"path":"skirt.type","op":"in","values":["tiered"]}]'::jsonb, '{"property":"weight","max":1,"strength":"prefer"}'::jsonb, 3, '{"ar":"الطبقات تحتاج خامة خفيفة حتى لا تثقل التنورة","en":"Tiers need a light fabric so the skirt does not get heavy"}'::jsonb, true),
  ('fitted-bodice-body', '[{"path":"bodice.fit","op":"in","values":["fitted"]}]'::jsonb, '{"property":"body","min":2,"strength":"prefer"}'::jsonb, 4, '{"ar":"الصدر المحدد يحتاج خامة متماسكة تحافظ على الشكل","en":"A fitted bodice needs a fabric with body to hold its shape"}'::jsonb, true),
  ('loose-bodice-drape', '[{"path":"bodice.fit","op":"in","values":["loose"]}]'::jsonb, '{"property":"drape","min":2,"strength":"prefer"}'::jsonb, 2, '{"ar":"القصة الواسعة تبدو أنعم في خامة تنسدل","en":"A loose cut looks better in a fabric that drapes"}'::jsonb, true),
  ('puff-sleeve-body', '[{"path":"sleeve.type","op":"in","values":["puff","bishop"]}]'::jsonb, '{"property":"body","min":2,"strength":"prefer"}'::jsonb, 4, '{"ar":"الكم المنفوخ يحتاج خامة متماسكة ليحافظ على انتفاخه","en":"A puffed sleeve needs a fabric with body to hold its volume"}'::jsonb, true),
  ('bishop-sleeve-drape', '[{"path":"sleeve.type","op":"in","values":["bishop"]}]'::jsonb, '{"property":"drape","min":2,"strength":"prefer"}'::jsonb, 3, '{"ar":"كم البيشوب ينسدل بنعومة عند الكبك في خامة سائبة","en":"A bishop sleeve falls softly into the cuff in a draping fabric"}'::jsonb, true),
  ('flutter-sleeve-drape', '[{"path":"sleeve.type","op":"in","values":["flutter"]}]'::jsonb, '{"property":"drape","min":2,"strength":"must"}'::jsonb, 4, '{"ar":"الكم الفراشة يحتاج خامة سائبة ليتحرك بنعومة","en":"A flutter sleeve needs a draping fabric to move softly"}'::jsonb, true),
  ('collar-body', '[{"path":"neckline.collar","op":"in","values":["peter-pan","shirt","mandarin"]}]'::jsonb, '{"property":"body","min":3,"strength":"prefer"}'::jsonb, 4, '{"ar":"الياقة تحتاج خامة متماسكة لتقف في مكانها","en":"A collar needs a crisp fabric to stand properly"}'::jsonb, true),
  ('collar-not-limp', '[{"path":"neckline.collar","op":"in","values":["peter-pan","shirt","mandarin"]}]'::jsonb, '{"property":"body","min":1,"strength":"must"}'::jsonb, 4, '{"ar":"الخامة الرخوة جدا لا تحمل الياقة حتى مع الدك","en":"A very limp fabric cannot carry a collar, even with interfacing"}'::jsonb, true),
  ('lining-not-heavy', '[{"path":"lining","op":"is-true"}]'::jsonb, '{"property":"weight","max":2,"strength":"prefer"}'::jsonb, 2, '{"ar":"البطانة تضيف وزنا، لذلك الأفضل خامة غير ثقيلة","en":"A lining adds weight, so a not-heavy outer fabric is better"}'::jsonb, true),
  ('pleats-hold', '[{"path":"skirt.type","op":"in","values":["pleated"]}]'::jsonb, '{"property":"body","min":2,"strength":"must"}'::jsonb, 5, '{"ar":"الطيات تحتاج خامة تثبت الكي وتحافظ على حدة الطية","en":"Pleats need a fabric that holds a crease"}'::jsonb, true),
  ('straight-skirt-body', '[{"path":"skirt.type","op":"in","values":["straight","a-line"]}]'::jsonb, '{"property":"body","min":2,"strength":"prefer"}'::jsonb, 3, '{"ar":"التنورة المستقيمة تحتاج خامة متماسكة حتى لا تتجعد عند الجلوس","en":"A straight skirt needs some body so it does not wrinkle when sitting"}'::jsonb, true),
  ('pockets-opaque', '[{"path":"pockets","op":"in","values":["side-seam","patch"]}]'::jsonb, '{"property":"weight","min":1,"strength":"must"}'::jsonb, 3, '{"ar":"الجيب يظهر من خلف الخامة الشفافة جدا","en":"The pocket shows through a very sheer fabric"}'::jsonb, true),
  ('patch-pocket-body', '[{"path":"pockets","op":"in","values":["patch"]}]'::jsonb, '{"property":"body","min":2,"strength":"prefer"}'::jsonb, 2, '{"ar":"الجيب الخارجي يحتاج خامة متماسكة ليبقى مسطحا","en":"A patch pocket needs a fabric with body to sit flat"}'::jsonb, true),
  ('long-skirt-light', '[{"path":"skirt.length","op":"in","values":["ankle","floor"]}]'::jsonb, '{"property":"weight","max":2,"strength":"prefer"}'::jsonb, 2, '{"ar":"الطول الكبير في خامة ثقيلة يزيد الوزن على الخصر","en":"A long skirt in a heavy fabric adds weight at the waist"}'::jsonb, true),
  ('self-tie-belt-drape', '[{"path":"belt","op":"in","values":["self-tie"]}]'::jsonb, '{"property":"drape","min":2,"strength":"prefer"}'::jsonb, 2, '{"ar":"حزام الربط يحتاج خامة تنعقد بنعومة","en":"A tie belt needs a fabric that knots softly"}'::jsonb, true),
  ('button-closure-body', '[{"path":"closure.type","op":"in","values":["buttons"]}]'::jsonb, '{"property":"body","min":2,"strength":"prefer"}'::jsonb, 2, '{"ar":"فتحة الأزرار تحتاج خامة متماسكة حتى لا تتموج","en":"A button placket needs a fabric with body so it does not ripple"}'::jsonb, true),
  ('waistband-body', '[{"path":"waistband","op":"in","values":["straight","contour"]}]'::jsonb, '{"property":"body","min":2,"strength":"prefer"}'::jsonb, 2, '{"ar":"حزام الوسط يحتاج خامة متماسكة ليحمل الشكل","en":"A waistband needs a fabric with body to hold its shape"}'::jsonb, true)
on conflict (id) do nothing;
