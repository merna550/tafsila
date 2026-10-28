# M6 - AI layer

## Goal

A user adds 1 to 3 photos of a garment, the AI proposes the design features with a confidence for each, the user confirms or corrects them on a confirmation screen, and the engine drafts the pattern. On the pattern page she can ask for changes in Arabic or English, review the proposed changes and apply them as a new version. The AI only fills or edits a validated `DesignSpec`; the engine draws (ADR-002). Exit: ≥ 80 % feature accuracy on the 50-photo evaluation set (SRS §12).

## Scope

In:

- approved M6 screen designs;
- the 50-photo evaluation set, labelled by Merna;
- `packages/ai`: provider-neutral `analyzeDesign` and `proposeEdit` on the Vercel AI SDK, with a fake provider for tests;
- an evaluation harness (accuracy per feature, latency, cost);
- private photo storage, `ai_usage`, `unsupported_features`, `chat_messages`;
- background analysis (Inngest `design.analyze`) with daily caps and rate limits;
- upload and analysing screens, confirmation screen;
- chat edits API and chat panel, with the quota per pattern;
- compare two versions (the part of FR-CHAT-05 left after #252);
- the AI explanation of fabric recommendations (FR-REC-04, priority C);
- the provider choice from the evaluation, and the exit check.

Out:

- credits, plans and charging for analysis or chat (M7);
- production keys and the production project (M8, ADR-026);
- 3D preview, abaya/isdal/trousers, stretch fabrics (post-launch);
- geometric diff numbers in compare.

## SRS IDs

FR-DES-01..05, FR-DES-07, FR-CHAT-01..06, FR-REC-04, NFR-02 (analysis < 30 s p95), NFR-04 (rate limits on AI endpoints), NFR-05 (private photos, delete on request, EXIF stripped), NFR-06, NFR-08, SRS §7 (`ai_usage`, `chat_messages`, `unsupported_features`, `designs.photo_paths`, `designs.analysis`), §8 (`/analyze`, `/chat`, `/chat/:msgId/apply`), §9 (AI integration), §13 open question 3 (AI provider).

## Deliverables

- `docs/design/screens/`: M6 screens with images (#335).
- `packages/test-fixtures/src/ai-eval/labels.json` and the labelling guide; photos kept privately outside the repo (#336).
- `packages/ai` (new) (#337) and `pnpm ai:eval` (#338).
- `packages/api` and `supabase/`: photos, `ai_usage`, `unsupported_features` (#339); analysis job (#340); chat edits (#343); explanation (#346).
- `apps/web`: upload and analysing (#341), confirmation (#342), chat panel (#344), compare (#345).
- `docs/decisions/347-ai-provider.md` with the evaluation numbers (#347); `docs/test-cases/ui/m6-exit.md` (#348).

## Exit criteria

≥ 80 % feature accuracy on the 50-photo set with the chosen provider (#347), and #348: upload → analyse → confirm → pattern → chat edit works on staging with the real provider and on CI with the fake one.

## Dependencies

- From M3: the design picker cards and catalogue (FR-DES-06), the pattern page, versions (ADR-236, ADR-245, ADR-252). From M5: the recommendations panel (#319) for #346.
- Inside M6 every issue lists "Depends on #N". Critical paths:
  - #337 AI package → #338 harness → #347 evaluation (also needs Merna's #336 and #340) → #348 exit;
  - #339 photos → #340 analysis → #341 upload → #342 confirmation → #348;
  - #337 → #343 chat API → #344 chat panel → #348;
  - #335 screens before every UI issue (#341, #342, #344, #345).
- Everything except #347 builds and tests with the **fake provider**, so only #347 waits for the provider decision.

## Decisions

[ADR-335](../decisions/335-m6-scope.md):

- `packages/ai` on the Vercel AI SDK, provider by env only, a fake provider for CI and local work;
- the evaluation photos stay out of the repo; labels are in the repo;
- analysis runs in an Inngest job (ADR-012) on the Inngest free tier; chat runs in the request;
- caps: 10 analyses a day per user, 10 chat messages per pattern, rate limits on both routes; usage logged per call;
- the confirmation screen reuses the design picker cards; a feature below 0.6 confidence must be confirmed;
- compare is a browser overlay regenerated in the preview worker; no new API;
- no charging in M6; credits come in M7.

**Open, needs Merna (`needs:decision` on #347):** real provider calls cost money and need a payment method, which ADR-022 (free tiers until the beta) forbids without her approval.

## Merna's tasks

- **Approve the M6 screens** on the design canvas (#335): every UI issue waits for them.
- **Collect and label the 50 photos** (#336): this is tailor knowledge and needs image rights.
- **Answer the spending question** on #347 and, once approved, add the provider key to staging.
- Review the Arabic texts in #341, #342, #344.
- Run the exit check on staging (#348).

## Risks

- **Accuracy below 80 %:** few-shot examples and one prompt round in #347; weak features become issues; the manual picker remains the fallback (FR-DES-06).
- **Cost:** caps and usage logging from the first call; the evaluation reports EGP per pattern against the ≤ 5 EGP target.
- **Privacy:** private bucket, signed URLs, EXIF stripped in the browser and checked in the job, delete with the design and the account, provider with no training on API data.
- **Vercel Hobby limits:** analysis runs in an Inngest job, not in a long request; chat stays well under the function limit.
- **HEIC in browsers:** converted where the browser can decode it, otherwise a clear message (most phones can share JPEG).

## Issues

| Issue | Title                                                                  | Wave |
| ----- | ---------------------------------------------------------------------- | ---- |
| #335  | M6 screen designs in docs/design/screens                               | 1    |
| #336  | Merna: 50-photo evaluation set with tailor labels                      | 1    |
| #337  | packages/ai: provider-neutral analyzeDesign and proposeEdit            | 1    |
| #339  | Private design photos, ai_usage and unsupported_features tables        | 1    |
| #338  | AI evaluation harness: per-feature accuracy, latency and cost          | 2    |
| #340  | Analyse a design in the background with cost controls                  | 2    |
| #343  | Chat edits API: propose, validate and apply spec patches               | 2    |
| #346  | AI explanation of the fabric recommendations (FR-REC-04)               | 2    |
| #341  | Upload photos and start the analysis                                   | 2    |
| #345  | Compare two pattern versions as an overlay                             | 2    |
| #342  | Confirmation screen: confirm or correct every analysed feature         | 3    |
| #344  | Chat panel on the pattern page                                         | 3    |
| #347  | Evaluate Claude and Gemini on the 50 photos and choose the v1 provider | 3    |
| #348  | M6 exit check: photos to pattern to chat edit                          | 4    |

Waves are the order the dependencies allow; `/plan-wave M6` plans every issue whose dependencies are closed. #341, #342, #344 and #345 also wait for the screens (#335). If time runs short, #346 (P3) and #345 (P2) are cut first.
