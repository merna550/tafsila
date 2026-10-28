# Tafsila (تفصيلة) — Software Requirements Specification (SRS)

| Field | Value |
|---|---|
| Product | Tafsila / تفصيلة (working name; final name TBD) |
| Document | Software Requirements Specification |
| Version | 0.1 (draft) |
| Date | 2026-10-06 |
| Owner | Merna Ziad |
| Status | Draft — source of truth for building v1 (MVP) |

> How to use this file: keep it at the repo root as `docs/SRS.md`. Every feature, ticket, and PR should reference a requirement ID from here (e.g. `FR-PAT-03`). When a decision changes, update this file first, then the code.

---

## 1. Introduction

### 1.1 Purpose
Tafsila is a web application that turns photos of a garment into a complete, accurate, ready-to-cut sewing pattern, sized to standard sizes or a client's custom measurements. This document specifies what the software must do (functional requirements), how well it must do it (non-functional requirements), and the technical design constraints for v1.

### 1.2 Scope of v1 (MVP)
In scope:
- Garment types: **dress, skirt, blouse** — woven (non-stretch) fabrics only.
- Photo upload (front required; back and side optional) → AI design analysis → user confirmation.
- Standard sizes (Egyptian/EU chart) and custom measurements; saved client profiles.
- Parametric pattern generation with seam allowance, grain lines, notches, darts, labels.
- Automatic pattern validation report.
- Outputs: on-screen viewer, **projector mode** (1:1 calibrated), **direct-to-fabric mode** (numbered measured steps), PDF export (A4 tiled, A0).
- Fabric yardage calculation (nesting on chosen fabric width) and fabric-type recommendations.
- Chat-based design edits with version history.
- Free trial (3 patterns), pay-per-pattern, monthly subscriptions (Paymob).
- Arabic (RTL, Egyptian dialect) and English UI.

Out of scope for v1 (planned later):
- Simplified 3D assembly preview (step-by-step, non-physical): **post-launch** (ADR-009, milestone `Post-launch`).
- Abaya, isdal, trousers (v2); stretch fabrics, jackets, children's wear (v3).
- Physics-based cloth simulation (v2, Python service).
- Native mobile apps.
- Multi-size grading export for manufacturers.

### 1.3 Definitions
| Term | Meaning |
|---|---|
| Block | Base parametric pattern (bodice, sleeve, skirt) drafted from measurements |
| DesignSpec | Structured JSON describing a garment's design features (neckline, sleeve, skirt type…) |
| Measurements | Body measurements in millimetres |
| Ease | Extra width added to body measurement for comfort/style |
| Seam allowance (SA) | Margin outside the stitching line |
| Notch | Alignment mark matching two pieces |
| Grain line | Arrow showing fabric straight-grain direction |
| Nesting / marker | Arranging pieces on fabric to minimise usage |
| Toile | Test garment sewn from cheap fabric |
| Pattern version | Immutable snapshot of (DesignSpec + Measurements + engine version) and its output |

### 1.4 References
- FreeSewing (parametric pattern core, JS): https://freesewing.eu/docs/about/
- GarmentCode (parametric patterns + simulation, Python): https://arxiv.org/html/2306.03642v2
- Companion business document: "Tafsila — Project Overview & Business Plan" (Claude Docs, English and Arabic versions).

---

## 2. Overall Description

### 2.1 Product perspective
A standalone SaaS web app. The core idea: **the AI understands, the engine draws.** The LLM never produces geometry; it only produces/edits a validated `DesignSpec`. A deterministic TypeScript pattern engine produces all geometry from `DesignSpec + Measurements`.

```
Photos ──► AI Vision ──► DesignSpec (JSON, validated) ──► User confirms
                                                            │
Measurements ──────────────────────────────────────────────┤
                                                            ▼
                                            Pattern Engine (deterministic)
                                                            │
                                     ┌──────────────────────┼──────────────────────┐
                                     ▼                      ▼                      ▼
                              Validation report      Pattern geometry        Sewing order
                                                            │
             ┌───────────────┬───────────────┬──────────────┼──────────────┬───────────────┐
             ▼               ▼               ▼              ▼              ▼               ▼
         Viewer         Projector       Direct-cut      PDF export    Fabric calc      3D preview
```

### 2.2 User classes
| Class | Description | Key needs |
|---|---|---|
| Workshop owner (primary) | Small tailoring business, sews for clients | Speed, client profiles, projector, yardage |
| Beginner sewist (primary) | Little or no drafting knowledge | Guidance, validation, 3D explanation, fabric advice |
| Home sewist | Sews for self occasionally | Simple flow, pay-per-pattern |
| Student (later) | Fashion / home-economics student | Learning, 3D, versions |
| Admin (internal) | Merna | Users, payments, AI cost, catalogue, fabric rules |

### 2.3 Operating environment
- Modern browsers: Chrome, Edge, Safari, Firefox (last 2 versions). Desktop/laptop first (projector use); tablet supported; phone supported for upload, measurements, and viewing.
- Projector mode requires a desktop/laptop browser with Fullscreen API.

### 2.4 Constraints
- Solo founder → prefer managed services, one language (TypeScript), minimal infrastructure.
- All geometry in **millimetres** internally; display in cm.
- Market: Egypt. Currency EGP. Payments via Paymob.
- AI provider must be swappable (Claude / Gemini) without code changes outside the AI module.

### 2.5 Assumptions
- Users can take body measurements with a tape measure when guided.
- Front photo is clear and shows the whole garment.
- Open-source library licences (FreeSewing, GarmentCode) permit commercial SaaS use — **must be verified before v1 launch** (see §13).

---

## 3. System Architecture

### 3.1 Tech stack
| Layer | Choice |
|---|---|
| Language | TypeScript (strict) everywhere; Python only for v2 simulation service |
| Web app | Next.js (App Router) + React |
| UI | Tailwind CSS + shadcn/ui, RTL support, `next-intl` (ar, en) |
| State | Zustand (client), React Query/Server Actions (server data) |
| Forms & validation | React Hook Form + Zod |
| Pattern engine | `@tafsila/engine` package built on FreeSewing core + custom parts |
| Rendering | SVG (viewer, projector); Three.js + React Three Fiber (3D) |
| PDF | `pdf-lib` (or `@freesewing/svg2pdf`) |
| Nesting | SVGnest-style algorithm in a Web Worker |
| AI | Vercel AI SDK; provider = Claude or Gemini; structured output via Zod schemas |
| DB / Auth / Storage | Supabase (Postgres, Auth with phone OTP, Storage) |
| ORM | Drizzle, only through `withUser` (ADR-035) |
| Background jobs | Inngest (or Trigger.dev) |
| Payments | Paymob (cards, wallets, Fawry reference) |
| Hosting | Vercel (web) + Supabase cloud |
| Monitoring | Sentry (errors), PostHog (product analytics) |
| Testing | Vitest (unit/geometry), Playwright (E2E) |
| Repo | pnpm + Turborepo monorepo, GitHub |

### 3.2 Monorepo layout
```
tafsila/
├─ apps/
│  └─ web/                    # Next.js app (UI + API routes + server actions)
├─ packages/
│  ├─ engine/                 # Pattern engine: blocks, design features, validation, sewing order
│  ├─ schemas/                # Zod schemas + TS types: DesignSpec, Measurements, PatternJSON
│  ├─ nesting/                # Fabric layout / yardage (runs in Web Worker)
│  ├─ export/                 # PDF (A4 tiled, A0), SVG, (DXF later)
│  ├─ ai/                     # Prompts, provider adapter, structured-output calls, cost tracking
│  ├─ fabric-kb/              # Fabric catalogue + recommendation rules (data + logic)
│  └─ ui/                     # Shared UI components
├─ services/
│  └─ sim/                    # (v2) Python FastAPI + GarmentCode simulation
├─ docs/
│  └─ SRS.md                  # this file
└─ supabase/
   └─ migrations/
```

### 3.3 Key architectural rules
1. **Engine is pure and deterministic**: `generatePattern(spec, measurements, options) → PatternResult`. Same input → identical output. No network, no randomness, no Date.
2. **Engine runs in browser and server** (instant regeneration on measurement change; server used for exports and persistence).
3. **AI never returns geometry.** AI outputs must pass the `DesignSpec` Zod schema; invalid output is retried once, then the user edits manually.
4. **Every pattern version is immutable** and stores `engineVersion` so old patterns reproduce exactly.
5. **Pattern JSON is the contract** between engine, exports, nesting, 3D, and the future Python sim service.

---

## 4. Functional Requirements

Priority: **M** = must (v1), **S** = should (v1 if time), **C** = could (later).

### 4.1 Accounts & Auth (AUTH)
| ID | Requirement | Pri |
|---|---|---|
| FR-AUTH-01 | Sign up / sign in with email + password and Google OAuth | M |
| FR-AUTH-02 | Phone number verification by OTP is required before using the free trial. The production channel (SMS or WhatsApp) is chosen at M8 by price (ADR-024); dev/staging use test numbers. _Status: API, database and limits built (issue #26 part A, [ADR-26a](decisions/26a-phone-otp-trial.md)); the screen is part B_ | M |
| FR-AUTH-03 | One free trial per verified phone number (prevent multi-account abuse). _Status: built in the database and API (keyed hash kept after account deletion), issue #26 part A_ | M |
| FR-AUTH-04 | Password reset, sign out, delete account (deletes images and personal data). _Status: delete-account API built (issue #27 part A, [decision 27a](decisions/27a-settings-delete-account.md)); the screen is part B_ | M |
| FR-AUTH-05 | User chooses language (ar/en) and unit display (cm; inches later). _Status: `GET`/`PATCH /api/profile` built (issue #27 part A); the settings screen is part B_ | M |

### 4.2 Measurements & Client Profiles (MEAS)
| ID | Requirement | Pri |
|---|---|---|
| FR-MEAS-01 | Select a standard size (S–XXL) from a size chart (Egyptian/EU default; chart editable by admin). Anyone outside S–XXL uses custom measurements; more sizes later are data only (ADR-024) | M |
| FR-MEAS-02 | Enter custom measurements (list in §6.2) with an illustrated guide per measurement (image + short Arabic text). Built in #31 as a dialog opened from each box with numbered steps and a warning, in Arabic and English; the drawings are placeholders until the beta | M |
| FR-MEAS-03 | Validate measurements: a hard range per measurement (error), and cross-checks. Errors (block): high bust > bust, under bust ≥ bust, waist-to-knee ≥ waist-to-floor. Warnings (never block): waist ≥ hip, bust point distance > bust/2, front length < back length, waist-to-floor outside 50-70% of height. Each result has a stable code and an Arabic and English message (ADR-28a) | M |
| FR-MEAS-04 | Save measurement sets as named client profiles; a workshop user can store unlimited profiles (plan-limited). API: `/api/clients` and `/api/measurements`, paging by `limit` + `offset` (ADR-29a), impossible measurements rejected with bilingual errors, warnings returned. Screens: `/clients` (search, paging, create) and `/clients/[id]` (edit, delete, measurement sets); each client carries a `summary` (set count, newest size label and date) | M |
| FR-MEAS-05 | Start from a standard size and override individual measurements. Built in #31: screens `/clients/[id]/measurements/new` and `/clients/[id]/measurements/[setId]`; a box that differs from the size is marked "adjusted" with "reset to size"; errors from `validateMeasurements` block saving, warnings do not | S |
| FR-MEAS-06 | Ease preference per pattern: fitted / regular / loose (maps to ease tables). Delivered in M3 because it is chosen per pattern (ADR-024) | M |

### 4.3 Photo Upload & AI Design Analysis (DES)
| ID | Requirement | Pri |
|---|---|---|
| FR-DES-01 | Upload 1–3 photos (front required; back, side optional); JPG/PNG/WebP/HEIC, ≤ 10 MB each; client-side resize to ≤ 1600 px long edge | M |
| FR-DES-02 | Choose garment category before analysis (dress/skirt/blouse) or let AI detect it; unsupported categories show "coming soon" | M |
| FR-DES-03 | AI returns a `DesignSpec` + per-feature confidence (0–1) + notes on uncertain features | M |
| FR-DES-04 | Show a **confirmation screen**: each feature shown as a visual option card; low-confidence (< 0.6) features highlighted for the user to choose | M |
| FR-DES-05 | User can edit any feature manually from catalogue options (no AI needed) | M |
| FR-DES-06 | Start a design without photos: a visual design picker where the user chooses each feature manually (works with zero AI; built before the AI layer and kept as the fallback) | M |
| FR-DES-07 | Features that exist in the photo but not in the catalogue are reported to the user ("not supported yet") and logged for product research | M |
| FR-DES-08 | "My designs" list: designs with title, type, client, version count and state; title search, client filter, delete with confirmation; "New pattern" from the list, the clients page and the client profile (the profile also shows her latest designs) | M |

### 4.4 Pattern Generation (PAT)
| ID | Requirement | Pri |
|---|---|---|
| FR-PAT-01 | Generate all pattern pieces from `DesignSpec + Measurements + EaseProfile` | M |
| FR-PAT-02 | Each piece includes: stitching line, cutting line (SA), grain line, notches, darts, piece name (ar/en), cut quantity ("cut 2", "cut 1 on fold"), size/client label, scale check square | M |
| FR-PAT-03 | Seam allowance configurable globally and per edge (default 1.5 cm sides, 1 cm necklines/armholes, 3 cm hems); panel limits 0-5 cm per edge kind, fabric width 50-300 cm, default 140 cm (#247) | M |
| FR-PAT-04 | Regeneration after measurement/option change completes in < 500 ms in browser (no AI call) | M |
| FR-PAT-05 | Supported features v1 (see catalogue §6.1): bodice with darts, princess seams; necklines; sleeves; skirts; waistbands; closures; pockets; lengths | M |
| FR-PAT-06 | Output also includes a **sewing order** (ordered list of assembly steps referencing piece edges) used by 3D preview and instructions. Phases and the one-step-per-seam rule: decision 146 | M |
| FR-PAT-07 | Facings / linings generated where the feature requires (e.g. neckline facing) (#145: lining copies bodice, skirt and tier pieces; sleeves, collars, cuffs, bands, facings, pockets and belt are unlined; facing trim in #226) | S |

### 4.5 Pattern Validation (VAL)
The engine runs these checks on every generation and returns a report (`pass | warn | fail` per check, with the measured values).

| ID | Check | Rule (default tolerance) | Pri |
|---|---|---|---|
| FR-VAL-01 | Seam length match | Paired seams (e.g. front side vs back side) differ ≤ 2 mm, unless intentional ease is declared | M |
| FR-VAL-02 | Sleeve cap ease | Sleeve cap length − armhole length within 1.0–4.0 cm for woven set-in sleeves; a cap's declared gathers (`gatheredMm`, puff) and the armhole it is not sewn to (`armholeExcludedMm`, cap and flutter) are taken out first (#142) | M |
| FR-VAL-03 | Circumference check | Sum of pieces at bust/waist/hip = measurement + ease ± 5 mm | M |
| FR-VAL-04 | Notch alignment | Every notch has a matching notch on the paired edge at the same distance (± 2 mm) | M |
| FR-VAL-05 | Geometry integrity | Closed outlines, no self-intersections, SA present on all cut edges | M |
| FR-VAL-06 | Grain & labels | Every piece has grain line, name, and cut quantity | M |
| FR-VAL-07 | Dart sanity | Dart legs equal length (± 1 mm); dart point not past bust point limit | M |
| FR-VAL-08 | Plausibility | Warn if ease is negative for woven, or a piece exceeds max fabric width | M |
| FR-VAL-09 | UI shows report with ✅/⚠️/❌, plain-Arabic explanation, and highlights the affected edge on the pattern | M |

### 4.6 Pattern Viewer (VIEW)
| ID | Requirement | Pri |
|---|---|---|
| FR-VIEW-01 | SVG viewer with zoom, pan, fit-to-screen, toggle layers (SA, notches, labels, grid) | M |
| FR-VIEW-02 | Click a piece to see its measurements and cut instructions | M |
| FR-VIEW-03 | Measure tool: distance between two points | S |

### 4.7 Projector Mode (PROJ)
| ID | Requirement | Pri |
|---|---|---|
| FR-PROJ-01 | Fullscreen 1:1 display; black background, high-contrast lines (white/yellow), adjustable line width | M |
| FR-PROJ-02 | **Calibration**: show a calibration grid/square; user measures it on the cutting surface and enters the real size; app computes `pxPerMm` (separate X/Y factors) and stores it per device (`pxPerMm` is CSS px per real mm, see ADR-285) | M |
| FR-PROJ-03 | Verification square (10 × 10 cm) always visible to re-check scale | M |
| FR-PROJ-04 | Show one piece at a time or a full layout; move/rotate pieces (rotation limited to grain-respecting 0°/180°) | M |
| FR-PROJ-05 | Mirror (flip) for projecting onto the wrong side; pan with keyboard/mouse in mm steps | M |
| FR-PROJ-06 | Keystone correction (4-corner adjustment) | C |

### 4.8 Direct-to-Fabric Mode (CUT)
| ID | Requirement | Pri |
|---|---|---|
| FR-CUT-01 | For each piece, generate numbered marking steps relative to reference lines (fold line / selvedge / top edge), e.g. "From the fold, measure 22.5 cm along the top edge and mark point A" | M |
| FR-CUT-02 | Curves are given as a series of offset points every 2–3 cm (configurable) with a "connect smoothly" instruction and a reference image of the curve | M |
| FR-CUT-03 | Printable / on-screen checklist view; steps can be ticked off | M |
| FR-CUT-04 | Each step shows a small diagram highlighting the current point | S |

### 4.9 Export (EXP)
| ID | Requirement | Pri |
|---|---|---|
| FR-EXP-01 | PDF A4 tiled with overlap marks, page grid map, and 10 cm test square on page 1. Built in a browser worker by `buildA4Pdf` ([ADR-288](decisions/288-pdf-builder.md)); the export dialog and worker are [ADR-289](decisions/289-export-worker.md) | M |
| FR-EXP-02 | PDF A0 (copy shop) single sheet(s) | M |
| FR-EXP-03 | SVG export (option in the export dialog, [ADR-289](decisions/289-export-worker.md)) | S |
| FR-EXP-04 | DXF (AAMA) export for plotters | C |
| FR-EXP-05 | Exports generated as background jobs for large files; user notified when ready; files stored 30 days. Deferred: M4 builds PDFs in a browser worker from a saved version, with no stored file ([ADR-281](decisions/281-m4-scope.md)) | M |

### 4.10 Fabric Yardage (FAB)
| ID | Requirement | Pri |
|---|---|---|
| FR-FAB-01 | User selects fabric width (90, 115, 140, 150, 160 cm or custom) and layout (folded / open), directional nap yes/no | M |
| FR-FAB-02 | Nesting algorithm arranges all cut pieces (respecting cut quantities, fold edges, grain rotation constraints) and returns required length in metres, rounded up to 0.1 m. _Status: placement and length built in `packages/nesting` (issue #316, [decision 316](decisions/316-nesting-placement.md)); nesting worker and calculator screen built in issue #318, [decision 318](decisions/318-fabric-calculator.md)_ | M |
| FR-FAB-03 | Optional shrinkage allowance (default +5%) and pattern-matching allowance. _Status: added to the length to buy, one pattern repeat per row of cut pieces (issue #316, [decision 316](decisions/316-nesting-placement.md))_ | S |
| FR-FAB-04 | Show the layout diagram (marker) and allow projector display of the whole layout. _Status: the marker diagram with zoom is on the calculator (issue #318); projector display follows_ | M |
| FR-FAB-05 | Separate calculations for main fabric, lining, interfacing | S |

### 4.11 Fabric Recommendation (REC)
| ID | Requirement | Pri |
|---|---|---|
| FR-REC-01 | Rules engine maps `DesignSpec` features → required fabric properties (drape, weight, body, stretch) | M |
| FR-REC-02 | Return top 3–5 fabrics from the catalogue (local Egyptian market names, e.g. كريب، شيفون، جورجيت، ستان، كتان، قطن بوبلين، فسكوز، تافتا) with a one-line reason each and "avoid" list | M |
| FR-REC-03 | Admin can edit fabric catalogue and rules without a deploy. API built in #317; screens built in #320 (`/admin/fabrics`, `/admin/fabric-rules`: add, edit, delete, conditions picked from the DesignSpec paths, preview before saving) | M |
| FR-REC-04 | Optional AI-written explanation (from rules output, not free invention) | C |

### 4.12 Chat Edits & Versions (CHAT)
| ID | Requirement | Pri |
|---|---|---|
| FR-CHAT-01 | User writes a request in Arabic or English ("add side pockets", "make the sleeve 5 cm longer") | M |
| FR-CHAT-02 | AI translates the request into a list of `DesignSpec` patch operations via tool calling; patches validated by Zod and the catalogue | M |
| FR-CHAT-03 | Before applying, show a summary of changes; user confirms → new pattern version | M |
| FR-CHAT-04 | Unsupported requests → AI explains politely what is not supported and suggests the closest supported option | M |
| FR-CHAT-05 | Version history: list, compare two versions (overlay), restore (list, read-only view and restore built in #252; compare is later) | M |
| FR-CHAT-06 | Chat message quota per pattern (default 10 on pay-per-pattern; plan-defined on subscriptions) | M |

### 4.13 3D Assembly Preview (3D)

> **Post-launch** (ADR-009): FR-3D-01…04 are not required to launch and are planned in the `Post-launch` milestone. Priority is "Should"; the engine's sewing order (FR-PAT-06) stays in v1 so 3D can be added without engine changes.

| ID | Requirement | Pri |
|---|---|---|
| FR-3D-01 | Parametric avatar scaled from measurements (base mesh morphed by bust/waist/hip/height) | S |
| FR-3D-02 | Step-by-step animation following the engine's sewing order: pieces move from flat layout to approximate body positions, seams highlighted as they "join" | S |
| FR-3D-03 | Each step shows the matching sewing instruction text (ar/en) | S |
| FR-3D-04 | Final approximate garment view, rotatable | S |
| FR-3D-05 | Physics-based drape via Python sim service (v2) | C |

### 4.14 Billing & Plans (BILL)
| ID | Requirement | Pri |
|---|---|---|
| FR-BILL-01 | Credit ledger: each new pattern (new design) consumes 1 credit; regenerations of the same design with new measurements do **not** consume credits | M |
| FR-BILL-02 | Free trial grants 3 credits after phone verification. _Issue #26 only exposes the eligibility flag (`trialEligible`, `private.is_trial_eligible`); granting credits is M7_ | M |
| FR-BILL-03 | Products: single pattern (49 EGP), 5-pack (199 EGP, 90-day expiry), Hobby monthly (149 EGP, 8 credits), Pro monthly (349 EGP, 30 credits, unlimited client profiles). Prices stored in DB, not code | M |
| FR-BILL-04 | Paymob integration: cards, mobile wallets, Fawry reference; server-side payment intention; webhook with HMAC verification; idempotent processing | M |
| FR-BILL-05 | Subscription renewal reminders and manual renewal (auto-renew if Paymob tokenisation is available) | M |
| FR-BILL-06 | Invoices/receipts page | S |
| FR-BILL-07 | Coupons / referral credits | S |

### 4.15 Admin (ADM)
| ID | Requirement | Pri |
|---|---|---|
| FR-ADM-01 | Dashboard: signups, trials, conversions, revenue, AI cost per pattern, failed validations | M |
| FR-ADM-02 | Manage size charts, fabric catalogue, recommendation rules, prices. Size chart editing and a read-only users list with stats: API built in #32 (Part A), screens built in #32 (Part B: `/admin/users`, `/admin/sizes`, CSV import and export); the default chart holds the Egyptian S-XXL values from #158. Fabric catalogue and recommendation rules: screens built in #320 | M |
| FR-ADM-03 | View user designs (with consent flag) and unsupported-feature log | M |
| FR-ADM-04 | Grant credits / refund | M |

### 4.16 Feedback loop (FBK)
| ID | Requirement | Pri |
|---|---|---|
| FR-FBK-01 | After a pattern is used, ask "Did it fit?" (fit rating + photo optional + which area was off) | M |
| FR-FBK-02 | Feedback is stored per pattern version and engine version for quality analysis | M |

---

## 5. User Flows (v1)

1. **New pattern**: Upload photos → (AI analysis job) → Confirm features → Choose size/client measurements + ease → Generate → Validation report → Viewer → Fabric calc & recommendation → Use (Projector / Direct-cut / PDF) → Feedback.
2. **Edit**: Open pattern → Chat request → Review change summary → Confirm → New version.
3. **Reuse for another client**: Open design → pick another client profile → regenerate (no credit).
4. **Trial → paid**: Sign up → verify phone → 3 credits → credits exhausted → paywall → Paymob → credits/subscription active.

---

## 6. Data Contracts

All schemas live in `packages/schemas` as Zod + inferred TS types. Lengths in **mm**.

### 6.1 DesignSpec (v1 catalogue)
```ts
type GarmentCategory = 'dress' | 'skirt' | 'blouse';

interface DesignSpec {
  schemaVersion: 1;
  category: GarmentCategory;              // parts per category (#144): dress needs bodice + skirt, ignores waistband; skirt needs skirt, ignores bodice, neckline, sleeve; blouse needs bodice, ignores skirt, waistband. Missing → fail; ignored → FR-VAL-08 warning
  fabricType: 'woven';                     // v1 only
  bodice?: {
    fit: 'fitted' | 'semi-fitted' | 'loose';
    shaping: 'darts' | 'princess-shoulder' | 'princess-armhole' | 'none'; // none: darts become ease; fitted + none warns (FR-VAL-08, #138)
    waistSeam: boolean;                    // dress only: true = bodice + skirt joined at the waist; false = one piece shoulder to hem, needs a straight or A-line skirt (#144); a blouse ignores it
  };
  neckline?: {
    front: 'round' | 'v' | 'square' | 'sweetheart' | 'boat' | 'high-round';
    back: 'round' | 'v' | 'square' | 'high-round';
    depthFrontMm?: number;                 // optional override, below the neck point; clamped with an FR-VAL-08 warning (#139)
    collar: 'none' | 'peter-pan' | 'shirt' | 'mandarin'; // needs round/high-round front and back; shirt: CF opening; mandarin: CF or CB opening; no depthFrontMm with a stand; else refused (#141)
  };
  sleeve?: {
    type: 'none' | 'set-in' | 'cap' | 'puff' | 'bishop' | 'flutter';
    length: 'cap' | 'short' | 'elbow' | 'three-quarter' | 'long';
    cuff: 'none' | 'band' | 'elastic'; // allowed: set-in all lengths (band from short, elastic short/elbow); cap, flutter: cap/short, no cuff; puff: cap/short/elbow, any cuff; bishop: three-quarter/long, band or elastic; else refused (#142)
  };
  skirt?: {
    type: 'straight' | 'a-line' | 'circle-half' | 'circle-full' | 'gathered' | 'pleated' | 'tiered';
    length: 'mini' | 'knee' | 'midi' | 'ankle' | 'floor';
    lengthMm?: number;
    slit?: { position: 'front' | 'back' | 'side'; lengthMm: number };
  };
  waistband?: 'none' | 'straight' | 'contour' | 'elastic'; // skirts only; 'none' = waist facing; a dress joins at its waist seam (#140)
  closure: { type: 'zip' | 'buttons' | 'none'; position: 'center-back' | 'side' | 'center-front' }; // buttons only at a centre line with no slit or split panels; none ignores position; a no-closure dress or skirt warns when its waist cannot pass the hips (FR-VAL-08, #143)
  pockets: Array<'side-seam' | 'patch'>; // POCKET_MATRIX (#145): side-seam refused on tiered, blouse, side zip; patch refused on pleated, gathered, tiered, circle skirts and princess-split fronts
  lining: boolean;                         // unlined: sleeves, collars, cuffs, bands, facings, pockets, belt (#145)
  belt?: 'none' | 'self-tie';
}

interface DesignAnalysisResult {
  spec: DesignSpec;
  confidence: Record<string, number>;      // keyed by feature path, e.g. "sleeve.type"
  unsupported: string[];                   // features seen but not in catalogue
  notes: string;                           // short, user-facing, ar/en
}
```

### 6.2 Measurements
```ts
interface Measurements {
  unit: 'mm';
  height: number;
  bust: number;          highBust: number;     underBust?: number;
  waist: number;         hip: number;          hipDepth: number;   // waist → hip line
  neck: number;          shoulderWidth: number; shoulderLength?: number;
  backLength: number;    // nape → waist
  frontLength: number;   // HPS → waist over bust
  bustPointDistance: number; bustHeight: number; // HPS → bust point
  armLength: number;     upperArm: number;     wrist: number;
  waistToKnee: number;   waistToFloor: number;
}
type EaseProfile = 'fitted' | 'regular' | 'loose';
```
Default ease tables (mm, total over the whole circumference, woven) live in `packages/engine/src/constants/ease.ts` and are editable by product decision. The `regular` column equals the example (bust +80, waist +40, hip +50); `fitted` and `loose` and the `bodice.fit` modifiers are proposals awaiting product approval ([decision 126](decisions/126-ease-tables.md)).

| Body line | fitted | regular | loose |
| --------- | ------ | ------- | ----- |
| bust      | 60     | 80      | 120   |
| waist     | 20     | 40      | 70    |
| hip       | 30     | 50      | 80    |
| upper arm | 40     | 50      | 80    |

`bodice.fit` adds -10 (fitted), 0 (semi-fitted) or +30 (loose) mm to bust, waist and hip; the total is never below 0.

### 6.3 PatternResult / Pattern JSON
```ts
interface PatternResult {
  engineVersion: string;                  // semver
  pieces: Piece[];
  sewingOrder: SewingStep[];
  validation: ValidationReport;
  notions?: Notion[];                     // bought notions { id, kind: 'elastic' | 'zip' | 'button', name, lengthMm, widthMm, quantity }: waist elastic (#140), the zip and the buttons (#143)
  meta: { category: GarmentCategory; sizeLabel: string; createdFrom: string /* hash of inputs */ };
}
interface Piece {
  id: string;                             // 'front-bodice'
  name: { ar: string; en: string };
  cut: { quantity: number; onFold: boolean; mirror: boolean; fabric: 'main' | 'lining' | 'interfacing' };
  stitchPath: Path;                       // closed, mm
  cutPath: Path;                          // stitchPath offset by SA
  edges: Edge[];                          // named edges with SA and pairing info
  notches: Notch[];
  bodyLines: BodyLine[];                  // geometric bust/waist/hip declarations: edge, horizontal or polyline (decision 135); `overlapMm` leaves a button extension out (#143)
  marks?: Mark[];                         // construction marks: pleat lines, gathers, slit, sleeve end, button (point), buttonhole (line) (#137, #142, #143)
  sleeveCap?: { edgeIds: string[]; armholeRefs: Array<{ pieceId: string; edgeId: string }>; gatheredMm?: number; armholeExcludedMm?: number }; // declared gathers and unsewn armhole (#142)
  grainLine: [Point, Point];
  darts: Dart[];
  labels: Label[];
  bbox: { widthMm: number; heightMm: number };
}
interface Edge { id: string; fromSegment: number; toSegment: number; kind?: 'side' | 'neckline' | 'armhole' | 'hem' | 'other' | 'fold'; seamAllowanceMm: number; pairsWith?: { pieceId: string; edgeId: string; intendedEaseMm?: number; reversed?: boolean } }
interface Notch { id: string; edgeId: string; atMm: number; marks?: 1 | 2; pairsWith?: { pieceId: string; edgeId: string; reversed?: boolean } }
interface SewingStep { order: number; action: 'sew' | 'press' | 'finish' | 'attach'; edges: string[]; text: { ar: string; en: string } }
interface ValidationReport { status: 'pass' | 'warn' | 'fail'; checks: Array<{ id: 'FR-VAL-01'..'FR-VAL-08' | 'FR-MEAS-01'; code?: string; status: 'pass' | 'warn' | 'fail'; message: { ar: string; en: string }; measuredMm?: number; expectedMm?: number; refs?: string[] }> }
```
`Notch.marks` is 1 (front, default) or 2 (back); `reversed` says the paired edges run in opposite directions, so the partner notch is at `length - atMm` (decision 131). `EngineOptions.clientLabel` (optional) is printed on every piece (FR-PAT-02). `Edge.kind` picks the default seam allowance (FR-PAT-03); `fold` edges never get one, and no kind means `other` (decision 130). `Path` = array of segments (`line` | `cubic`) in mm; each segment stores `from` and `to`, and the stitch and cut paths must be closed (tolerance 0.01 mm). Zod schemas: `packages/schemas/src/pattern.ts`; JSON Schema: `packages/schemas/json/pattern-result.schema.json` (`pnpm schemas:json`; it does not carry the continuity and closure refinements, which Zod checks). This JSON is the contract for exports, nesting, 3D, and the v2 Python sim service.

---

## 7. Data Model (Postgres / Supabase)

| Table | Key columns |
|---|---|
| `profiles` | id (= auth.users.id), name, phone, phone_verified_at, locale, role (`user`/`admin`), created_at |
| `clients` | id, owner_id, name, notes, created_at (unique id + owner_id) |
| `measurement_sets` | id, owner_id, client_id?, label, size_label?, data (jsonb Measurements), created_at (client must have the same owner) |
| `designs` | id, owner_id, category (`dress`/`skirt`/`blouse`), title (1-120 chars), photo_paths (text[]), analysis (jsonb DesignAnalysisResult), current_version_id, created_at, updated_at (set by the API; unique id + owner_id) |
| `pattern_versions` | id, design_id, owner_id (same owner as the design, composite FK), version_no (unique per design), spec (jsonb), measurement_set_id? (null if the set is deleted), measurements (jsonb snapshot), size_label?, ease_profile, options (jsonb), engine_version, validation_status (`pass`/`warn` only, a `fail` is never stored), input_hash (indexed, not unique), created_by (`user`/`chat`), created_at. Append-only: users can select and insert, never update or delete ([ADR-236](decisions/236-m3-scope.md)) |
| `exports` | id, pattern_version_id, kind (`pdf_a4`/`pdf_a0`/`svg`), status, file_path, expires_at. Not created in M4 (FR-EXP-05 deferred, [ADR-281](decisions/281-m4-scope.md)) |
| `chat_messages` | id, design_id, role, content, proposed_patch (jsonb), applied_version_id?, created_at |
| `fabric_calcs` | id, pattern_version_id, owner_id (same owner as the version, composite FK), options (jsonb: width, layout, nap, shrinkage, repeat), options_hash (unique with the version: one row per version and options, the last save replaces it), result (jsonb: per fabric kind `lengthM`, a positive multiple of 0.1, and the `placements`), nesting_version, created_at, updated_at. Owner-only through RLS, admins can read ([decision 317](decisions/317-fabric-api.md)) |
| `fabrics` | id (text slug), name_ar, name_en, properties (jsonb: drape, weight, body, stretch, sheen; integers 0 to 4, [ADR-314](decisions/314-fabric-kb-model.md)), care_notes (jsonb ar/en), is_draft, created_at, updated_at, updated_by. Read by signed-in users, written by admins (RLS), seeded by a migration ([decision 317](decisions/317-fabric-api.md)) |
| `fabric_rules` | id (text slug), condition (jsonb: list of path/op/values tests), required_properties (jsonb: property, min, max, `strength` prefer/must), priority 1 to 5, reason (jsonb ar/en), is_draft, created_at, updated_at, updated_by. Same access as `fabrics` |
| `size_charts` | id, name, sizes (jsonb), is_default, owner_id? (null = system chart; set = a user's private chart), updated_by, updated_at |
| `admin_audit` | id, who, action, target, before (jsonb), after (jsonb), at (append-only, admin only) |
| `products` | id, code, kind (`single`/`pack`/`subscription`), price_egp, credits, period_days, active |
| `subscriptions` | id, user_id, product_id, status, current_period_end, paymob_token? |
| `credit_ledger` | id, user_id, delta, reason (`trial`/`purchase`/`subscription`/`pattern`/`admin`/`refund`), ref_id, created_at |
| `payments` | id, user_id, product_id, amount_egp, status, paymob_order_id, raw (jsonb), created_at |
| `ai_usage` | id, user_id, design_id?, kind (`analyze`/`chat`), model, input_tokens, output_tokens, cost_usd, latency_ms, created_at |
| `feedback` | id, pattern_version_id, fit_rating, problem_areas (text[]), photo_path?, comment |
| `unsupported_features` | id, design_id, feature_text, created_at |

Security: Row Level Security on every user-owned table (`owner_id = auth.uid()`); admin via role (`is_admin()`). Users cannot change `role` or `phone_verified_at` (column grants). Photos in a private bucket with signed URLs. Backlog: EU size labels are a display hint before the beta; private workshop size charts (`size_charts.owner_id`) are a Pro feature after launch, with no UI yet (ADR-24a).

---

## 8. API Surface (Next.js route handlers / server actions)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness: `{ status, environment, version, gitSha, time }` |
| GET | `/api/openapi.json` | OpenAPI 3.1 document generated from the routes (`pnpm api:openapi`) |
| GET | `/api/docs` | Scalar API viewer (not served in production) |
| GET | `/api/me` | Current user `{ userId, role }` from the verified access token (401 without a valid token) |
| POST, GET | `/api/designs` | Create a design from `{ category, title? }` (no title: category word in the profile language + Cairo date, no upload URLs until M6); list with `q` (title search), `clientId`, `limit`, `offset`, newest `updated_at` first, each item with `summary { versionCount, currentStatus, clientName }`; returns `{ items, total, limit, offset }` |
| POST | `/api/designs/:id/analyze` | Enqueue AI analysis job (consumes credit on first generation, not here) |
| GET, PATCH, DELETE | `/api/designs/:id` | Read the design and its current version's stored inputs (`{ design, currentVersion }`; the version list and the regenerated pattern come from the version routes (#245)); rename (`{ title }`); delete (its versions go with it) |
| POST, GET | `/api/designs/:id/versions` | Save: `{ spec, measurementSetId, easeProfile, options }`; the server re-runs the engine, a `fail` report is refused (422 `PATTERN_INVALID` with `details.report`), the same inputs as the current version return it (200 `reused`), otherwise a new version (201) and the design's `current_version_id` change in one transaction. Returns `{ version, report, reused }` and a `Server-Timing: engine` header. List: `limit`, `offset`, newest `version_no` first, light rows with `isCurrent` |
| GET | `/api/versions/:id` | The stored inputs plus a pattern regenerated from them and `engineChanged` (the version was saved by another engine version); nothing is written |
| POST | `/api/versions/:id/restore` | Append a copy of the version's stored inputs (its measurements snapshot, re-run with today's engine) as version n+1; restoring the current version returns it (200) |
| POST | `/api/designs/:id/chat` | Send chat message → proposed patch |
| POST | `/api/designs/:id/chat/:msgId/apply` | Apply proposed patch → new version |
| POST | `/api/versions/:id/exports` | Enqueue PDF export. Deferred: M4 builds the PDF in the browser ([ADR-281](decisions/281-m4-scope.md)) |
| PUT, GET | `/api/versions/:id/fabric` | Save the fabric calculation the browser computed (`{ options, result, nestingVersion }`; `PUT` because one row is kept per version and options and the last save replaces it); the server checks that every length is a positive multiple of 0.1 m (422 `FABRIC_CALC_INVALID`). `GET` returns the latest saved calculation. Another user's version gives 404 |
| GET | `/api/fabrics/recommend?versionId=` | 3 to 5 recommended fabrics with a reason each, the avoid list and `isDraft`, from the database catalogue and rules; another user's version gives 404 |
| GET, POST | `/api/admin/fabrics`, `/api/admin/fabric-rules` | Admin: list; add (409 `FABRIC_ID_TAKEN` for a used id). Rules with an unknown path or value give 422 `FABRIC_RULE_INVALID` |
| PATCH, DELETE | `/api/admin/fabrics/:id`, `/api/admin/fabric-rules/:id` | Admin: change fields, delete. Each write and its `admin_audit` row (`fabric.*`, `fabric_rule.*`) are saved in one transaction; a non-admin gets 403 |
| POST, GET | `/api/clients` | Create a client; list with `q` (name search), `limit` (1-100, default 20), `offset`; returns `{ items, total, limit, offset }` |
| GET, PATCH, DELETE | `/api/clients/:id` | Read, change name/notes, delete (its measurement sets go with it) |
| POST, GET | `/api/measurements` | Save a measurement set (errors block with 422 `MEASUREMENTS_INVALID`, warnings are returned); list with `clientId`, `limit`, `offset` |
| GET, PUT, DELETE | `/api/measurements/:id` | Read (fresh warnings), replace label/size label/measurements, delete |
| POST | `/api/billing/checkout` | Create Paymob payment intention for a product |
| POST | `/api/billing/webhook` | Paymob callback (HMAC verified, idempotent) |
| GET | `/api/me/credits` | Balance + plan |
| GET | `/api/admin/stats` | Admin only: users, verified phones, sign-ups today and in 7 days, clients (ADR-32a) |
| GET | `/api/admin/users` | Admin only: users newest first with `q` (name, e-mail, phone), `verified`, `limit`, `offset`; a client count, never measurements or notes |
| GET | `/api/admin/users/:id` | Admin only: one user, read-only |
| GET, PUT | `/api/admin/size-charts/default` | Admin only: read the default size chart with its last editor; replace it (every size checked by the engine, errors give 422 `SIZE_CHART_INVALID`, chart and audit row saved together) |
| — | `/api/admin/*` (later) | Other admin endpoints (role-guarded) |

Background jobs (Inngest): `design.analyze`, `export.pdf`, `subscription.renewal-reminder`, `files.cleanup`.

---

## 9. AI Integration

| Topic | Requirement |
|---|---|
| Provider abstraction | `packages/ai` exposes `analyzeDesign(photos, hint)` and `proposeEdit(spec, message, history)`; provider/model chosen by env config |
| Structured output | Use schema-constrained output (Zod → JSON schema); reject and retry once on invalid output |
| Catalogue in prompt | System prompt lists the allowed enum values and short visual definitions of each; few-shot examples (photo description → spec) |
| Edit via tools | `proposeEdit` uses tool calls such as `setFeature(path, value)`, `setLength(path, mm)`, `addPocket(type)`, `explainUnsupported(text)` |
| Model tiering | Stronger vision model for `analyze`; cheaper model for chat edits |
| Cost control | Log every call to `ai_usage`; per-user daily caps; chat quota per pattern; never call AI for measurement-only regeneration; target ≤ 5 EGP AI cost per pattern |
| Safety & privacy | Photos sent only to the configured provider; no training opt-in by default; strip EXIF before upload |
| Evaluation | Maintain `ai-evals/` set of ≥ 50 labelled garment photos; track feature-level accuracy per model before switching providers |

---

## 10. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Accuracy | Engine geometry accurate to ± 1 mm vs. reference drafts; projector scale error ≤ 2 mm over 50 cm after calibration |
| NFR-02 | Performance | In-browser regeneration < 500 ms; AI analysis < 30 s (p95); PDF A4 export < 20 s (p95); LCP < 2.5 s on 4G |
| NFR-03 | Availability | 99.5% monthly (managed services) |
| NFR-04 | Security | HTTPS only; RLS on all tables; secrets in env; webhook HMAC; rate limiting on auth, AI, and checkout endpoints |
| NFR-05 | Privacy | Photos and measurements are personal data: private storage, signed URLs, delete-on-request, privacy policy in Arabic; comply with Egypt's Personal Data Protection Law (Law 151 of 2020) |
| NFR-06 | Localisation | Full Arabic RTL and English; numbers in Western digits by default (setting for Arabic-Indic); all user-facing engine strings bilingual |
| NFR-07 | Accessibility | WCAG 2.1 AA for core flows; projector mode keyboard-operable |
| NFR-08 | Reproducibility | A stored pattern version re-renders byte-identical SVG with the same engine version |
| NFR-09 | Observability | Sentry for errors (web + API + jobs) tagged with release, environment and request id; PostHog funnels: signup → verify → first pattern → paid; event schemas reject measurements, photos, phone and email (ADR-025) |
| NFR-10 | Maintainability | TypeScript strict; ESLint + Prettier; CI runs tests on every PR; engine coverage ≥ 85% |
| NFR-11 | Cost | Infra ≤ ~2,500 EGP/month until 200 paying users (excluding AI and marketing) |
| NFR-12 | Agent delivery | Ready issues can be built by a cloud agent while the founder's laptop is off: one issue at a time, no new work when 3 PRs await review, pausable with one variable, no secrets in the repo (ADR-016); at most `DISPATCH_DAILY_LIMIT` builds a day (default 4), 50 turns per run, and a stuck unattended agent stops and marks the issue `status:blocked` (ADR-017) |
| NFR-13 | Agent usage metrics | Every agent run produces one numbers-only record (tokens, turns, duration, API-equivalent cost, outcome, issue/PR, labels) stored on the `metrics` branch, never on `main`; no prompts, code or secrets in records; a weekly report issue lists totals, medians, top 3, flags and suggestions (ADR-028) |
| NFR-13 | Environments | Every PR gets a preview URL; every merge to `main` migrates the staging database, deploys staging and smoke-checks `/api/health` (environment and git SHA); migrations are applied by CI only; staging uses test OTP numbers; free tiers until the beta (ADR-022, ADR-023) |
| NFR-14 | Consistency | One design system (tokens, shared components), four frontend layers, one error contract with an Arabic message for every code; all enforced in CI, not by memory (ADR-029, ADR-030, ADR-031) |

---

## 11. Testing Strategy

| Level | What | Tool |
|---|---|---|
| Engine unit | Every block and feature; measurements matrix (sizes S–XXL + 20 real custom sets) | Vitest |
| Geometry property tests | All FR-VAL checks pass for every catalogue combination × size matrix | Vitest (+ fast-check) |
| Snapshot | SVG snapshots per (spec, size) to catch unintended geometry changes | Vitest |
| AI evals | Feature accuracy on labelled photo set; run before model/prompt changes | Script in `ai-evals/` |
| E2E | Signup → trial → upload → confirm → generate → export → pay (Paymob sandbox) | Playwright |
| Physical QA | Each garment type sewn as a toile in ≥ 3 sizes before release; fit notes recorded | Manual (founder) |
| Projector QA | Calibration accuracy measured with tape at 4 positions | Manual |

---

## 12. Delivery Plan (v1)

Milestone titles match the GitHub milestones exactly. Durations live on the milestones, not here. The product is fully usable before M6 through the manual design picker (FR-DES-06).

| Milestone | Content | Exit criteria |
|---|---|---|
| M0 - Foundation & environments | Repo, tooling, CI/CD, agent config, dev/staging environments (Vercel URLs), Sentry, PostHog | Staging deployed from `main`; errors and analytics from staging visible |
| M1 - Accounts & data | Auth + phone OTP (test numbers), profiles, client profiles, measurements UI with guide, Egyptian size chart S–XXL, mini admin (users list, size-chart editor), DB schema + RLS, seed data | A user signs up, verifies phone, saves a client with measurements; RLS tests pass |
| M2 - Engine core | Schemas, blocks, dress/skirt/blouse modules, seam allowance, notches, grain, labels, validation | All FR-VAL checks pass across the size matrix; toiles sewn in 3 sizes per garment |
| M3 - Design & pattern UI | Manual design picker (FR-DES-06), ease preference (FR-MEAS-06), pattern viewer, validation report UI, versions | A user builds a design by hand and sees a validated pattern for a saved client |
| M4 - Outputs | Projector + calibration, direct-cut steps, PDF A4/A0 | Toile sewn from projector and from PDF fits |
| M5 - Fabric | Yardage/nesting, fabric catalogue and rules, recommendations | Yardage within ±10 cm of a manual layout on 5 garments |
| M6 - AI layer | Photo analysis, confirmation UI, chat edits | ≥ 80% feature accuracy on the 50-photo eval set |
| M7 - Billing & admin | Credits, free trial, Paymob, plans, receipts, admin dashboard | Paid flow works in Paymob sandbox and one live test payment |
| M8 - Beta & launch readiness | Production project + "Deploy to production" workflow (ADR-026), domain, production OTP channel (SMS vs WhatsApp), closed beta (20–30 sewists), feedback loop (FR-FBK), privacy policy/terms, landing page, onboarding, FAQ | Satisfaction ≥ 80%; no open fit-failure bugs; legal pages live |
| M9 - Public launch | Production release, monitoring, launch marketing | Public sign-ups open; on-call checklist done |
| Post-launch | 3D assembly preview (FR-3D-01…04), abaya/isdal/trousers, stretch fabrics | — |

---

## 13. Open Questions / Decisions Log

| # | Question | Status |
|---|---|---|
| 1 | Product name and domain | Name decided: Tafsila / تفصيلة. Domain bought at M8; staging and early prod use Vercel URLs (ADR-024) |
| 2 | Verify FreeSewing licence for commercial SaaS; decide fork vs dependency | Decided: no dependency or fork; FreeSewing (MIT) is a cited reference only ([ADR-122](decisions/122-m2-engine-scope.md)) |
| 3 | AI provider for v1 (Claude vs Gemini) after eval on 50 photos | Open |
| 4 | Default Egyptian size chart source and values | Open — founder to compile |
| 5 | Paymob fees, merchant onboarding requirements, recurring payments support | Open |
| 6 | Base avatar mesh source and licence for 3D (avoid restricted-licence body models) | Open |
| 7 | Credit rule for heavy chat edits that change garment category | Proposed: counts as a new pattern |
| 8 | Production OTP channel: SMS (Twilio/Vonage/MessageBird) or WhatsApp | Deferred to M8; compare per-message prices then (ADR-024) |
| 9 | Standard size range | Decided: S–XXL (ADR-024) |

---

## 14. Glossary (Arabic ↔ English)
| عربي | English |
|---|---|
| باترون | Pattern |
| خط الخياطة | Stitching line |
| خط القص / حرف الخياطة | Cutting line / Seam allowance |
| اتجاه القماش (الدرزة) | Grain line |
| علامة تطابق | Notch |
| بنسة | Dart |
| راحة | Ease |
| على الطي | On fold |
| دوران الكم | Sleeve cap |
| فتحة الإبط | Armhole |
| تجربة (توال) | Toile / muslin |
| خط البرسل | Selvedge |
