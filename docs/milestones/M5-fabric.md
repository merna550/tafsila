# M5 - Fabric

## Goal

From a saved pattern version, the user chooses a fabric width and layout and learns how many metres to buy for the main fabric, lining and interfacing, sees the marker (and can project it at 1:1), and gets 3 to 5 suitable fabrics with reasons and an "avoid" list (SRS §12). The yardage is within ±10 cm of a manual layout on 5 garments.

## Scope

In:

- approved M5 screen designs;
- spike to choose the nesting algorithm;
- `packages/nesting`: fabric options, piece preparation for folded and open layouts, grain and nap, placement, length with shrinkage and pattern repeat, rounded up to 0.1 m, main / lining / interfacing separately;
- `packages/fabric-kb`: catalogue and rule types, draft data, `recommend`;
- database tables `fabrics`, `fabric_rules`, `fabric_calcs` with the recommend, save and admin APIs;
- fabric calculator with a marker diagram in a Web Worker;
- recommendations panel;
- admin catalogue and rules editor;
- projecting the whole layout;
- Merna's manual layout check;
- exit check.

Out:

- the AI-written explanation (FR-REC-04, M6);
- fabric images, prices and suppliers;
- stretch fabrics (post-launch);
- keystone (FR-PROJ-06);
- credits (M7).

## SRS IDs

FR-FAB-01..05, FR-REC-01..03, FR-ADM-02 (fabric catalogue and rules), FR-VAL-08 (piece wider than the fabric), NFR-02 (worker, page responsive), NFR-04 (RLS, admin writes), NFR-06 (bilingual names and reasons), NFR-08 (deterministic layouts), SRS §7 (`fabric_calcs`, `fabrics`, `fabric_rules`), §8 (`/api/versions/:id/fabric`, `/api/fabrics/recommend`).

## Deliverables

- `docs/design/screens/`: M5 screens with images (#312).
- `packages/nesting` (new): algorithm choice (#313), options and piece preparation (#315), placement and length (#316).
- `packages/fabric-kb` (new): catalogue, rules, `recommend`, reviewed draft data (#314).
- `packages/api` and `supabase/`: tables, seed by migration, recommend, save and admin routes (#317).
- `apps/web`: fabric calculator and marker in a worker (#318), recommendations (#319), admin editor (#320), projecting the layout (#321).
- `docs/test-cases/engine/yardage-checks.md` with Merna's numbers (#322); `docs/test-cases/ui/m5-exit.md` (#323).

## Exit criteria

Yardage within ±10 cm of a manual layout on 5 garments (SRS §12), measured by Merna in #322, together with #323: calculator, marker, projector layout and recommendations work from a saved version on staging, e2e on CI.

## Dependencies

- From M4: the projector view (#286, #287) and the export worker pattern (ADR-289) are merged; M5 reuses both. The open M4 issues (#293-#296) are Merna's physical checks and do not block M5 builds.
- From M3 and M1: saved versions with their `DesignSpec` (ADR-245); the admin area and audit (ADR-32a, ADR-32b).
- Inside M5 every issue lists "Depends on #N". Critical paths:
  - #312 screens → #313 spike → #315 preparation → #316 placement → #318 calculator → #321 projector, then #322 Merna's check → #323 exit;
  - #312 → #314 fabric-kb → #317 API → #319 recommendations and #320 admin → #323.

## Decisions

[ADR-312](../decisions/312-m5-scope.md):

- two new pure packages;
- the algorithm is chosen by a spike, with no GPL code and a deterministic result;
- nesting runs in the browser worker, regenerated from the version's inputs;
- folded and open models, grain 0° / 180° and nap only 0°;
- length rounded up to 0.1 m with shrinkage and repeat;
- the last calculation is stored per version with `nesting_version`;
- catalogue and rules live in the database, seeded by a migration and edited in the admin with audit;
- the content is Merna's (draft first);
- recommendations run on the server;
- the projector is reused;
- AI, prices and stretch fabrics are out.

## Merna's tasks

- **Approve the M5 screens on the design canvas** (#312): every UI issue waits for them.
- **Review the draft fabric catalogue and rules** in the #314 PR. This is sewing knowledge: the property scales of each fabric (drape, weight, body, sheen), which designs need or must avoid which properties, and the Arabic market names.
- Review the Arabic texts in #318 to #320.
- Physical check (#322): lay 5 garments by hand on real fabric or paper and compare with the app's length. Needs a cutting table, a tape and fabric or kraft paper at 140 and 115 cm.
- Run the exit check on staging (#323).

## Risks

- **Nesting quality:** a simple placement may waste more fabric than a tailor. The spike (#313) measures it first, and #322 compares it with real layouts; ±10 cm is the bar.
- **Speed on low-end laptops:** circle skirts have long curved outlines. Polygon simplification (tolerance from the spike), a worker, and a timed benchmark in #316 keep it in check.
- **Folded fabric is subtle:** fold edges, mirrored pairs and on-fold pieces are where tailors spot mistakes first. #315 has a test per rule and drawings in its docs.
- **Recommendation content** is only as good as the rules. The DRAFT label, Merna's review, and admin editing after launch mitigate this.
- **Bundle size:** `@tafsila/nesting` must stay in the worker chunk; the bundle guard from ADR-289 is extended in #318.

## Issues

| Issue | Title                                                               | Wave |
| ----- | ------------------------------------------------------------------- | ---- |
| #312  | M5 screen designs in docs/design/screens                            | 1    |
| #313  | Spike: choose the nesting algorithm and prove it on real patterns   | 2    |
| #314  | packages/fabric-kb: catalogue and recommendation rules              | 2    |
| #315  | packages/nesting: fabric options and piece preparation              | 3    |
| #317  | Tables, recommend and save endpoints, admin fabric APIs             | 3    |
| #316  | Place the pieces and compute the fabric length                      | 4    |
| #319  | Fabric recommendations with reasons and an avoid list               | 4    |
| #320  | Admin fabric catalogue and rules editor                             | 4    |
| #318  | Fabric calculator with marker diagram on the saved version          | 5    |
| #321  | Project the whole fabric layout                                     | 6    |
| #322  | Merna: manual layouts of 5 garments compared with the app's yardage | 6    |
| #323  | Exit check: yardage and recommendations from a saved version        | 7    |

Waves are the order the dependencies allow; `/plan-wave M5` plans every issue whose dependencies are closed. All code issues are size S or M. If time runs short, #320 (admin editor, P2) and #321 (projecting the layout, P2) are cut first; the catalogue can be changed by a migration until the editor lands.
