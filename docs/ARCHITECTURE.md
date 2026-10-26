# Tafsila — Architecture

**Style overall:** a _modular monolith_ in one monorepo. Each part has its own internal architecture and talks to the others only through typed contracts (`packages/schemas`). Any part can later be deployed on its own without a rewrite.

```
            ┌──────────────── packages/schemas (Zod contracts: DesignSpec, Measurements, PatternResult, API bodies) ───────────────┐
            │                                                                                                                    │
 apps/web (Next.js, feature-sliced) ──HTTP (typed client)──► packages/api (Hono, hexagonal) ──jobs/HTTP──► services/sim (Python, v2)
        │                                                          │
        └──────────── packages/engine (functional core, plugin modules) ◄───┘   (same engine in browser and server)
```

| Part                | Architecture                                          | Why                                                                                             |
| ------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `apps/web`          | Feature-sliced frontend                               | Each feature is self-contained; shared UI in one design system                                  |
| `packages/api`      | Hexagonal (ports & adapters) / clean architecture     | Business rules independent of Supabase, Paymob, AI vendor; easy to test and swap                |
| `packages/engine`   | Functional core + plugin pipeline                     | Deterministic, testable geometry; new garment features added as modules without touching others |
| `packages/export`   | Pure data in, data out (print tiles, later PDF)       | The PDF code only draws what the tile maths returns; no UI or API code in it (`docs/export/`)   |
| `services/sim` (v2) | Small hexagonal service                               | Same rules as the API, in Python                                                                |
| Data                | Postgres + RLS, repository pattern, migrations in git | Security at the DB level; reproducible environments                                             |

---

## 1. Frontend — `apps/web` (feature-sliced)

Details: `docs/frontend/README.md` · agent notes: `apps/web/CLAUDE.md`.

```
apps/web/src/
├─ app/                     # Next.js routes ONLY: thin pages that compose features (no logic)
│  └─ [locale]/(dashboard)/designs/[id]/page.tsx
├─ features/                # one folder per feature, public API via index.ts
│  ├─ upload-design/        # components/ hooks/ (useAnalyzeDesign) model/ index.ts
│  ├─ confirm-spec/
│  ├─ measurements/
│  ├─ pattern-viewer/
│  ├─ projector/
│  ├─ direct-cut/
│  ├─ fabric/
│  ├─ chat-edit/
│  ├─ assembly-3d/
│  └─ billing/
├─ entities/                # small shared domain views: Design, Client, PatternVersion (cards, badges)
├─ shared/                  # api client, i18n, query client, workers, analytics
└─ messages/{ar,en}.json
```

Rules

- **Import direction:** `app → features → entities → shared → packages/*`. A feature imports another feature only via its `index.ts`.
- **Server vs client components:** pages and data loading are Server Components; interactive tools (viewer, projector, 3D, forms) are Client Components.
- **Server state:** TanStack Query over a **typed API client** generated from the API (Hono RPC types / OpenAPI). No `fetch` inside components.
- **Local UI state:** component state; Zustand only for the pattern editor session (selected piece, zoom, layers).
- **Engine in the browser:** instant regeneration on the main thread; heavy work (fabric nesting, PDF tiling) in a **Web Worker**. The preview and the export each have their own worker (`shared/pattern-preview`, `shared/pattern-export`, [ADR-289](decisions/289-export-worker.md)); `pdf-lib` is loaded only by the export worker.
- **Design system:** `packages/ui` (shadcn/ui based, RTL-first, tokens for colour/spacing); features never restyle primitives ad hoc.

## 2. Backend — `packages/api` (hexagonal / clean)

Details: `docs/backend/README.md` · agent notes: `packages/api/CLAUDE.md`.

```
packages/api/src/
├─ routes/          # HTTP adapter (Hono): validate (Zod) → call use case → map result/error to HTTP
├─ middleware/      # auth (Supabase JWT), request-id + logging, rate limit, error mapper, i18n of errors
├─ services/        # application use cases: AnalyzeDesign, CreatePatternVersion, ApplyChatEdit, ConsumeCredit, Checkout
├─ domain/          # entities + business rules with no I/O: credit rules, version rules, plan limits, errors
├─ ports/           # interfaces the services need: DesignRepository, ClientRepository, FileStorage,
│                   #   PaymentGateway, AIProvider, JobQueue, Clock, IdGenerator
├─ adapters/        # implementations: supabase/, paymob/, anthropic/, gemini/, inngest/, memory/ (fakes for tests)
├─ jobs/            # background functions (Inngest) that call the same services
├─ container.ts     # composition root: wires ports → adapters per environment (prod / test / local)
└─ app.ts           # builds the Hono app; mounted in Next.js at /api now, or run standalone (apps/api) later
```

Request flow: `route → middleware → service(use case) → domain rules → port → adapter → DB/Paymob/AI` and back.

Rules

- **Dependencies point inward:** routes → services → domain; services depend on `ports`, never on `adapters` (enforced by dependency-cruiser).
- **One use case per file**, named as an action (`create-pattern-version.ts`), with input/output Zod schemas from `packages/schemas`.
- **Errors:** domain errors (`NotFoundError`, `InsufficientCreditsError`, `ValidationError`) mapped to HTTP in one middleware; API error body is always `{ code, message_ar, message_en, details? }`.
- **Transactions & idempotency:** credit consumption + version creation in one DB transaction; payment webhooks idempotent by `paymob_order_id`.
- **Testing:** services tested with `memory/` adapters (fast, offline); adapters tested against local Supabase / sandbox; routes tested end-to-end + Postman/Newman.
- **Swapping a vendor** = new adapter + one line in `container.ts`.

## 3. Pattern engine — `packages/engine` (functional core + plugin pipeline)

Details: `docs/engine/README.md` · agent notes: `packages/engine/CLAUDE.md`.

```
DesignSpec + Measurements + Options
        │
  1. resolve      → derive drafting inputs (ease tables, constants)          (pure)
  2. blocks       → base blocks: bodice, skirt, sleeve, trousers…            (pure)
  3. modules      → registered feature modules transform blocks              (pure, plugin registry)
  4. finishing    → seam allowance, notches, grain, darts, cut info           (pure)
  5. layout       → label placement (polylabel), collision-free annotations  (pure)
  6. validate     → FR-VAL checks → ValidationReport                         (pure)
  7. sewingOrder  → assembly steps for instructions + 3D                     (pure)
        │
   PatternResult (JSON contract)  → viewer · projector · direct-cut · PDF · nesting · 3D · sim
```

Module contract (open/closed principle):

```ts
/** A garment feature that can modify blocks when the DesignSpec asks for it. */
export interface FeatureModule {
  id: string; // "neckline/v", "sleeve/ruched"
  appliesTo(spec: DesignSpec): boolean;
  draft(ctx: DraftContext): DraftContext; // pure: returns a new context
  validations?: ValidationRule[]; // extra checks this feature needs
}
```

Rules: no I/O, no randomness, no `Date`; millimetres only; every module registers its own validation rules and tests; `engineVersion` stamped on every result so stored patterns re-render identically.

## 4. Simulation service — `services/sim` (v2, Python)

```
api/ (FastAPI routes) → app/ (use cases) → ports/ → adapters/ (garmentcode, storage, queue)
```

Input/output = `PatternResult` JSON Schema generated from `packages/schemas` (single source of truth). Runs as its own container on a GPU platform; the API talks to it through the `JobQueue` port.

## 5. Data

- Postgres (Supabase) with Row Level Security on every user-owned table; repositories in `adapters/supabase` are the only code that writes SQL/queries.
- Immutable `pattern_versions`; credits as an append-only ledger.
- Migrations in `supabase/migrations`, seed in `supabase/seed.sql`, generated DB types consumed by adapters only.

## 6. Cross-cutting

| Concern                   | Where                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Config per environment    | `packages/config/env.ts` (Zod), runtime only (same image everywhere)                                            |
| Logging & tracing         | request-id middleware → structured logs; Sentry for errors                                                      |
| Analytics & feature flags | PostHog, wrapped in `shared/analytics` (frontend) and an `Analytics` port (backend); errors via `ErrorReporter` |
| i18n                      | `messages/{ar,en}.json` (UI), bilingual error messages from domain errors                                       |
| Security                  | Supabase auth, RLS, rate limiting, webhook HMAC, signed storage URLs, secrets only in env                       |

## 7. Evolution path

| Trigger                         | Change                                                       | Effort                           |
| ------------------------------- | ------------------------------------------------------------ | -------------------------------- |
| Mobile app or heavy API traffic | Run `packages/api` as `apps/api` container (Hono standalone) | Small: same code, new entry file |
| Leave Vercel                    | Deploy the Docker images anywhere                            | Small                            |
| Leave Supabase                  | New repository/storage adapters + Postgres elsewhere         | Medium, isolated to adapters     |
| Real cloth simulation           | Enable `services/sim` behind the JobQueue port               | Medium                           |
