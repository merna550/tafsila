# ADR-158 · 2026-10-14 · Default size chart: Egyptian S-XXL

**Context:** Issue #158 replaces the PLACEHOLDER default chart (demo values from #31) with an Egyptian women's chart. Merna asked for researched, not invented, values.

**Decision:**

1. The default system chart is "Egyptian women S-XXL (NRC Cairo / Moustafa 1987, derived)", 5 sizes x 18 measurements. It no longer starts with `PLACEHOLDER`, so the admin banner disappears.
2. **What is researched and what is derived (stated honestly):**
   - **Researched:** bust, hip and height. Sources: the NRC Cairo / Dr. Azza Serry El-Din national sizing project (sizes 48-54 most common, hips wider than bust); Moustafa et al., _Ergonomics_ 1987 (4,960 Egyptian women); an Alexandria study (mean height about 159 cm, 160 cm used for every size).
   - **Derived, not measured on Egyptian women:** waist and the other 14 measurements (high bust, under bust, hip depth, neck, shoulder width, back length, front length, bust point distance, bust height, arm length, upper arm, wrist, waist to knee, waist to floor). They follow standard pattern proportions and grow with the size step.
   - The values are a starting point for a tailor to review against real clients, not a survey result. Replace them from `/admin/sizes` when better data exists.
3. The values are the table Merna supplied, in cm. Data is stored in whole mm. Both forms live in the repo: `supabase/data/egyptian-size-chart.csv` (cm, the format the `/admin/sizes` import accepts) and `packages/test-fixtures/src/egyptian-size-chart.ts` (mm, with the source notes in a comment). A test checks the two agree.
4. `size-chart-sql.ts` now generates the migration from `egyptianSizeChart`; the existing migration `20261013120000_default_size_chart.sql` was regenerated in place (the drift test needs the two to match). `demoSizeChart` stays as a fixture for tests only.
5. Environments that already ran the old migration (staging) keep the old row. Importing the CSV in `/admin/sizes` replaces it and writes the audit log. That step is manual (Merna).
6. Every size passes `validateMeasurements` with no errors and no warnings (engine test).

**Reason:** Matches Merna's request; keeps new environments identical to the imported chart.

**Alternatives:** a second migration that updates the row (the drift test and fresh environments are simpler with one insert; the placeholder was never a real chart); keeping the demo chart until the survey data is complete.
