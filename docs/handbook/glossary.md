# Glossary

Every term in `docs/` and in the code that is not everyday English, A to Z. Software terms and sewing/pattern terms are in one list. Other docs can link to an entry, for example `glossary.md#rls`.

Format of an entry: **Plain words** (what it means), **In Tafsila** (where we use it), **Card** (the technology card, written in #9; shown as plain text until that card exists), **Level** (beginner, intermediate or advanced), **Learn** (official or best starting link).

Add new terms in alphabetical order with an explicit `<a id="..."></a>` anchor (see [handbook README](README.md)). Arabic names of sewing terms are from [SRS section 14](../SRS.md).

**Jump to:** [0-9](#letter-0) · [A](#letter-a) · [B](#letter-b) · [C](#letter-c) · [D](#letter-d) · [E](#letter-e) · [F](#letter-f) · [G](#letter-g) · [H](#letter-h) · [I](#letter-i) · [J](#letter-j) · [K](#letter-k) · [L](#letter-l) · [M](#letter-m) · [N](#letter-n) · [O](#letter-o) · [P](#letter-p) · [R](#letter-r) · [S](#letter-s) · [T](#letter-t) · [U](#letter-u) · [V](#letter-v) · [W](#letter-w) · [Y](#letter-y) · [Z](#letter-z)

<a id="letter-0"></a>

## 0-9

<a id="scale-1-1"></a>

### 1:1 scale

**Plain words:** Life size: one millimetre on screen or paper is one real millimetre.  
**In Tafsila:** Projector mode and the A4/A0 PDFs are 1:1; a 10 x 10 cm verification square lets you check it (FR-PROJ-03). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Scale_(ratio)>

<a id="letter-a"></a>

## A

<a id="acceptance-criteria"></a>

### Acceptance criteria

**Plain words:** The checklist in an issue that says exactly when the work counts as done. Each item is a checkbox.  
**In Tafsila:** Ticked one by one with `scripts/gh-ac.sh check <issue> <n>` as soon as each is verified; the PR shows `scripts/gh-ac.sh progress <issue>` ([WORKFLOW section 5](../WORKFLOW.md), ADR-009). **Level:** beginner  
**Learn:** <https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues>

<a id="adapter"></a>

### Adapter

**Plain words:** The code that fulfils a [port](#port) with a real tool (or a fake in tests), such as the real clock or the Supabase database.  
**In Tafsila:** `packages/api/src/adapters/` (today `system/system-clock.ts`). See [hexagonal](patterns/hexagonal-ports-adapters.md). **Level:** intermediate  
**Learn:** <https://alistair.cockburn.us/hexagonal-architecture/>

<a id="adr"></a>

### ADR (Architecture Decision Record)

**Plain words:** A short note that records one decision, the reason, and what was rejected, so nobody has to ask again.  
**In Tafsila:** Numbered `ADR-001`... in [DECISIONS.md](../DECISIONS.md), newest first. Agents read it before asking questions. **Level:** beginner  
**Learn:** <https://adr.github.io/>

<a id="affected-build"></a>

### Affected build (affected-only checks)

**Plain words:** Running checks only for the packages a change touched, plus the packages that depend on them, instead of the whole repo.  
**In Tafsila:** `turbo run typecheck test --filter=...[origin/main]` in the Stop [hook](#hook) and on pull requests in the Code quality workflow (`scripts/ci-scope.sh`); a change to root config, and every push to `main`, checks everything (ADR-017). **Card:** [Turborepo](tech/turborepo.md) · **Level:** intermediate  
**Learn:** <https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters>

<a id="agent"></a>

### Agent (AI agent)

**Plain words:** An AI model that does a task by itself using tools (read files, run commands, open pull requests) instead of only chatting.  
**In Tafsila:** Most of Tafsila is built by Claude agents following [CLAUDE.md](../../CLAUDE.md) and [WORKFLOW.md](../WORKFLOW.md); the owner reviews. See [skill](#skill-agent) and [slash command](#slash-command). **Card:** [Claude Code](tech/claude-code.md) · **Level:** beginner  
**Learn:** <https://docs.claude.com/en/docs/claude-code/overview>

<a id="ai-provider"></a>

### AI provider

**Plain words:** The company whose AI model Tafsila calls to read photos and edit designs (Claude or Gemini).  
**In Tafsila:** Chosen by env vars `AI_PROVIDER`, `AI_MODEL_ANALYZE`, `AI_API_KEY` (`packages/config/src/env.ts`); hidden behind an `AIProvider` port (planned, [SRS section 9](../SRS.md)). **Level:** intermediate  
**Learn:** <https://ai-sdk.dev/docs>

<a id="api"></a>

### API (Application Programming Interface)

**Plain words:** A set of addresses and rules that lets one program ask another to do something. Here: the web app asks the server over HTTP.  
**In Tafsila:** `packages/api` (Hono), served at `/api/*`. Today: `GET /api/health`. See [request journey](map/request-journey.md). **Card:** [Hono](tech/hono.md) · **Level:** beginner  
**Learn:** <https://developer.mozilla.org/en-US/docs/Glossary/API>

<a id="api-equivalent-cost"></a>

### API-equivalent cost

**Plain words:** What a run would cost at the public per-token API prices. Merna pays a subscription, so this is not a bill; it is a common yardstick to compare runs, models and weeks.  
**In Tafsila:** `est_cost_usd` in each agent usage record, from the price table in `scripts/agent-usage.mjs`; shown in the weekly report ([tutorial](../backend/tutorials/agent-usage.md)). **Card:** [Claude Code](tech/claude-code.md#measuring-agent-usage) · **Level:** beginner  
**Learn:** <https://www.anthropic.com/pricing>

<a id="app-router"></a>

### App Router

**Plain words:** Next.js's way of building pages from folders: a `page.tsx` inside `src/app/<route>/` becomes a URL.  
**In Tafsila:** `apps/web/src/app/`, including the catch-all `api/[[...route]]/route.ts`. **Card:** [Next.js](tech/nextjs.md) · **Level:** beginner  
**Learn:** <https://nextjs.org/docs/app>

<a id="arabic-indic-digits"></a>

### Arabic-Indic digits

**Plain words:** The digits used in Arabic script (٠١٢٣٤٥٦٧٨٩) as opposed to Western digits (0123456789).  
**In Tafsila:** Western digits are the default; Arabic-Indic is a user setting ([SRS NFR-06](../SRS.md)). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Arabic_numerals>

<a id="armhole"></a>

### Armhole

**Plain words:** The opening in a bodice where the sleeve is sewn in (Arabic: فتحة الإبط).  
**In Tafsila:** The sleeve cap must be slightly longer than the armhole seam so it can be eased in; checked by FR-VAL-02 ([engine docs](../engine/README.md)). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Sewing_pattern>

<a id="supply-chain"></a>

### Attestation

**Plain words:** A signed statement about how an image was built and what is inside it.  
**In Tafsila:** Written by the Docker workflow (`attestations: write` permission); see [SBOM](#sbom). **Card:** [Docker](tech/docker.md) · **Level:** advanced  
**Learn:** <https://docs.docker.com/build/metadata/attestations/>

<a id="auth"></a>

### Auth (authentication and authorisation)

**Plain words:** Authentication proves who you are (login); authorisation decides what you may do.  
**In Tafsila:** Supabase Auth with phone [OTP](#otp); permissions via [RLS](#rls) (planned, M1). **Card:** [Supabase](tech/supabase.md) · **Level:** beginner  
**Learn:** <https://supabase.com/docs/guides/auth>

<a id="letter-b"></a>

## B

<a id="bezier"></a>

### Bezier curve

**Plain words:** A smooth curve defined by a few control points. Pattern curves (necklines, sleeve caps) are drawn with them.  
**In Tafsila:** `packages/engine/src/geometry/bezier.ts` (`CubicBezier`, `sampleCubic`). **Level:** intermediate  
**Learn:** <https://pomax.github.io/bezierinfo/>

<a id="bias"></a>

### Bias

**Plain words:** The diagonal direction of woven fabric (45 degrees to the grain). It stretches and drapes more than the straight grain.  
**In Tafsila:** Bias-cut pieces need a grainline at 45 degrees; bias is not in the v1 catalogue. Also used for bias binding. **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Bias_(textile)>

<a id="bisection"></a>

### Bisection (binary search for a number)

**Plain words:** Finding a value by repeatedly halving the range that must contain it. It works when the result only goes up (or only down) as the input grows.  
**In Tafsila:** `solveSleeveCapHeight` in `packages/engine/src/sleeve/sleeve-cap.ts` uses it to find the cap height. **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Bisection_method>

<a id="block-sloper"></a>

### Block (sloper)

**Plain words:** A basic, plain-fitting pattern (bodice, sleeve, skirt) drafted from body measurements. Designers change it to make a style. Arabic: باترون أساسي.  
**In Tafsila:** Step 2 of the engine pipeline ([SRS section 1.3](../SRS.md)). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Sewing_pattern#Drafting>

<a id="board"></a>

### Board (project board)

**Plain words:** The GitHub Projects view with columns Backlog, Ready, In progress, In review, Done.  
**In Tafsila:** Moved with `scripts/gh-project.sh` ([WORKFLOW section 8](../WORKFLOW.md)). **Level:** beginner  
**Learn:** <https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects>

<a id="bodice"></a>

### Bodice

**Plain words:** The part of a garment that covers the upper body, from shoulders to waist.  
**In Tafsila:** `DesignSpec.bodice` has `fit`, `shaping` and `waistSeam` (`packages/schemas/src/design-spec.ts`). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Sewing_pattern>

<a id="bbox"></a>

### Bounding box (bbox)

**Plain words:** The smallest rectangle that contains a shape; its width and height tell how much room a piece needs.  
**In Tafsila:** Each `Piece` has `bbox: { w, h }` ([SRS section 6.3](../SRS.md)); used by nesting. **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Minimum_bounding_box>

<a id="branch"></a>

### Branch

**Plain words:** A separate line of work in Git so changes do not touch `main` until reviewed.  
**In Tafsila:** Every issue gets its own branch (`feat|fix|chore|docs/<N>-<slug>`); nobody commits to `main` ([CLAUDE.md](../../CLAUDE.md) rule 1). **Level:** beginner  
**Learn:** <https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell>

<a id="build-label"></a>

### `build:*` and `plan:*` labels

**Plain words:** GitHub labels on an issue that say which AI model plans it (`plan:opus|sonnet|none`) and builds it (`build:opus|sonnet|haiku`).  
**In Tafsila:** Chosen during triage to save tokens; rubric in [WORKFLOW section 2](../WORKFLOW.md). **Level:** intermediate  
**Learn:** <https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels>

<a id="build"></a>

### Build (compile)

**Plain words:** Turning source code into the files that actually run, checking types and optimising along the way.  
**In Tafsila:** `pnpm build` runs `turbo run build`; the web app builds with `next build` into a standalone output ([ADR-004](../DECISIONS.md)). **Card:** [Turborepo](tech/turborepo.md) · **Level:** beginner  
**Learn:** <https://nextjs.org/docs/app/getting-started/deploying>

<a id="bust-point"></a>

### Bust point, bust height, high bust, under bust

**Plain words:** Body measurements around the chest: the bust point is the apex of the bust; high bust is measured above it; under bust just beneath it.  
**In Tafsila:** Fields `bustPointDistance`, `bustHeight`, `highBust`, `underBust` in `packages/schemas/src/measurements.ts` (millimetres). They place darts and the bust level. **Level:** intermediate  
**Learn:** <https://freesewing.org/docs/measurements/>

<a id="letter-c"></a>

## C

<a id="calibration"></a>

### Calibration (projector)

**Plain words:** Showing a square of known size on the cutting surface, measuring it, and telling the app the real size, so the app learns how many pixels equal one millimetre.  
**In Tafsila:** FR-PROJ-02 stores `pxPerMm` per device; accuracy target is 2 mm over 50 cm ([SRS NFR-01](../SRS.md)). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Sewing_pattern>

<a id="ci-cd"></a>

### CI/CD (continuous integration / delivery)

**Plain words:** Robots that run on every change: **CI** runs checks and tests; **CD** ships the result to an environment.  
**In Tafsila:** GitHub Actions in `.github/workflows/` (`quality.yml`, `docker.yml`, `status-labels.yml`); production deploy is a manual click by the owner ([WORKFLOW section 1](../WORKFLOW.md)). **Card:** [GitHub Actions](tech/github.md) · **Level:** beginner  
**Learn:** <https://docs.github.com/en/actions>

<a id="claude-md"></a>

### CLAUDE.md

**Plain words:** A Markdown file that Claude Code reads automatically at the start of a session to learn the project's rules.  
**In Tafsila:** Root [CLAUDE.md](../../CLAUDE.md) plus per-area files in `apps/web`, `packages/api`, `packages/engine` (ADR-008). **Level:** beginner  
**Learn:** <https://docs.claude.com/en/docs/claude-code/memory>

<a id="cli"></a>

### CLI (command-line interface)

**Plain words:** A program you use by typing commands in the terminal.  
**In Tafsila:** `pnpm`, `gh`, `supabase`, `docker`, `claude`. **Level:** beginner  
**Learn:** <https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Environment_setup/Command_line>

<a id="client-component"></a>

### Client Component

**Plain words:** A React component that runs in the browser, so it can react to clicks and keep state. Marked with `"use client"` in Next.js.  
**In Tafsila:** Interactive tools (viewer, projector, forms) are Client Components ([ARCHITECTURE section 1](../ARCHITECTURE.md)). **Card:** [Next.js](tech/nextjs.md) · **Level:** intermediate  
**Learn:** <https://nextjs.org/docs/app/getting-started/server-and-client-components>

<a id="closure"></a>

### Closure

**Plain words:** What fastens the garment: a zip or buttons.  
**In Tafsila:** `DesignSpec.closure` has `type` (`zip`, `buttons`, `none`) and `position` (`center-back`, `side`, `center-front`). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Sewing_pattern>

<a id="collar"></a>

### Collar (peter-pan, shirt, mandarin)

**Plain words:** A band or flap around the neck. Peter Pan: flat with rounded ends. Shirt: folds over a stand. Mandarin: a short upright band with no fold.  
**In Tafsila:** `neckline.collar` values `none`, `peter-pan`, `shirt`, `mandarin`. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Collar_(clothing)>

<a id="composition-root"></a>

### Composition root

**Plain words:** The single place where the program decides which real implementation fills each [port](#port).  
**In Tafsila:** `packages/api/src/container.ts`. See [composition root](patterns/composition-root.md). **Level:** intermediate  
**Learn:** <https://blog.ploeh.dk/2011/07/28/CompositionRoot/>

<a id="container"></a>

### Container

**Plain words:** A packaged, isolated mini-computer that runs one program with everything it needs. Same container, same behaviour anywhere.  
**In Tafsila:** The web app ships as a Docker container image ([ADR-004](../DECISIONS.md)); `compose.yaml` runs local services. **Card:** [Docker](tech/docker.md) · **Level:** beginner  
**Learn:** <https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/>

<a id="container-di"></a>

### Container (dependency container)

**Plain words:** In the API code, the object that holds all wired dependencies (clock, build info). Not the same as a Docker [container](#container).  
**In Tafsila:** `Container` interface and `createContainer()` in `packages/api/src/container.ts`. **Level:** intermediate  
**Learn:** <https://martinfowler.com/articles/injection.html>

<a id="context-map"></a>

### Context map

**Plain words:** A table that tells an agent which few files to read for each kind of task, so it does not explore the whole repo.  
**In Tafsila:** [docs/CONTEXT_MAP.md](../CONTEXT_MAP.md), linked from `CLAUDE.md`, `/plan` and `/build` (ADR-017). **Card:** [Claude Code](tech/claude-code.md) · **Level:** beginner  
**Learn:** <https://docs.claude.com/en/docs/claude-code/memory>

<a id="conventional-commits"></a>

### Conventional commits

**Plain words:** A naming style for commit messages: `type(scope): summary`, such as `docs(handbook): add glossary (#8)`.  
**In Tafsila:** Required, with the issue number ([WORKFLOW section 5](../WORKFLOW.md)). **Level:** beginner  
**Learn:** <https://www.conventionalcommits.org/en/v1.0.0/>

<a id="corepack"></a>

### Corepack

**Plain words:** A Node.js tool that runs the exact package-manager version a project asks for.  
**In Tafsila:** Makes `pnpm` use the version pinned in `packageManager` in `package.json` (set up by `scripts/bootstrap.sh`). **Card:** [pnpm](tech/pnpm.md) · **Level:** intermediate  
**Learn:** <https://nodejs.org/api/corepack.html>

<a id="coverage"></a>

### Coverage

**Plain words:** The share of code lines that tests run. It shows what is untested, not whether tests are good.  
**In Tafsila:** Engine coverage target is 85% or more ([SRS NFR-10](../SRS.md)). **Card:** [Vitest](tech/vitest.md) · **Level:** intermediate  
**Learn:** <https://vitest.dev/guide/coverage>

<a id="credit"></a>

### Credit

**Plain words:** One unit a user spends to generate a pattern (3 are free in the trial).  
**In Tafsila:** Stored as an append-only [ledger](#ledger); rules in the domain layer ([SRS section 4.14](../SRS.md)). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Ledger>

<a id="crud"></a>

### CRUD

**Plain words:** Create, Read, Update, Delete: the four basic things you do with stored data.  
**In Tafsila:** Most endpoints are CRUD plus business rules. **Level:** beginner  
**Learn:** <https://developer.mozilla.org/en-US/docs/Glossary/CRUD>

<a id="cuff"></a>

### Cuff

**Plain words:** The finish at the end of a sleeve: none, a band, or elastic.  
**In Tafsila:** `sleeve.cuff` values `none`, `band`, `elastic`. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Cuff>

<a id="cut-quantity"></a>

### Cut quantity, on fold, mirror

**Plain words:** How many of a piece to cut ("cut 2"), whether to place it on the fabric fold and cut once to get a symmetric double piece ("cut 1 on fold"), and whether the second is a mirror image. Arabic: على الطي.  
**In Tafsila:** `Piece.cut = { quantity, onFold, mirror, fabric }`. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Sewing_pattern>

<a id="cognitive-complexity"></a>

### Cyclomatic and cognitive complexity

**Plain words:** Numbers that estimate how hard a function is to read: more branches, loops and nesting means a higher score.  
**In Tafsila:** Lint limits: cyclomatic 10, cognitive 15, nesting depth 3 ([CODING_STANDARDS section 3](../CODING_STANDARDS.md)). **Card:** [ESLint](tech/eslint-prettier.md) · **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Cyclomatic_complexity>

<a id="letter-d"></a>

## D

<a id="dart"></a>

### Dart

**Plain words:** A folded wedge sewn to a point that shapes flat fabric around the body (at the bust or waist). Arabic: بنسة.  
**In Tafsila:** `darts` on each piece; FR-VAL-07 checks equal legs (within 1 mm). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Dart_(sewing)>

<a id="dependency"></a>

### Dependency

**Plain words:** Code written by someone else that your code uses, listed in `package.json`.  
**In Tafsila:** Locked by the [lockfile](#lockfile). **Card:** [pnpm](tech/pnpm.md) · **Level:** beginner  
**Learn:** <https://docs.npmjs.com/about-packages-and-modules>

<a id="dependency-injection"></a>

### Dependency injection

**Plain words:** Handing a function or class what it needs from outside instead of letting it create it, so tests can pass fakes.  
**In Tafsila:** Done by hand through the [composition root](#composition-root). **Level:** intermediate  
**Learn:** <https://martinfowler.com/articles/injection.html>

<a id="dependency-cruiser"></a>

### dependency-cruiser

**Plain words:** A tool that reads import statements and fails when code imports something it must not.  
**In Tafsila:** `pnpm depcruise`, rules in `.dependency-cruiser.cjs` ([CODING_STANDARDS section 8](../CODING_STANDARDS.md)). **Card:** [jscpd and dependency-cruiser](tech/jscpd-dependency-cruiser.md) · **Level:** intermediate  
**Learn:** <https://github.com/sverweij/dependency-cruiser>

<a id="deploy"></a>

### Deploy / deployment

**Plain words:** Putting a version of the app on a server so people can use it.  
**In Tafsila:** Preview per PR, staging on merge to `main`, production by one manual click ([WORKFLOW section 7](../WORKFLOW.md)). **Card:** [Vercel](tech/vercel.md) · **Level:** beginner  
**Learn:** <https://vercel.com/docs/deployments/overview>

<a id="design-system"></a>

### Design system

**Plain words:** One shared set of components, colours and spacing so every screen looks and behaves the same.  
**In Tafsila:** `packages/ui` plus tokens in `apps/web/src/app/globals.css` ([frontend docs](../frontend/README.md)). **Card:** [Tailwind CSS](tech/tailwind.md) · **Level:** beginner  
**Learn:** <https://ui.shadcn.com/docs>

<a id="designspec"></a>

### DesignSpec

**Plain words:** A JSON description of the garment's design (category, neckline, sleeve, skirt, closure, pockets, lining). It is the only thing AI produces.  
**In Tafsila:** `packages/schemas/src/design-spec.ts`; catalogue in [SRS section 6.1](../SRS.md). See [pattern journey](map/pattern-journey.md). **Card:** [Zod](tech/zod.md) · **Level:** beginner  
**Learn:** <https://zod.dev/>

<a id="direct-cut"></a>

### Direct-to-fabric mode

**Plain words:** Cutting without a printed pattern: the app lists numbered measuring steps ("from the fold, measure 22.5 cm and mark point A") to draw the piece straight onto the fabric.  
**In Tafsila:** FR-CUT-01 to FR-CUT-04 ([SRS section 4.8](../SRS.md)); curves are given as points every 2 to 3 cm. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Sewing_pattern>

<a id="dispatcher"></a>

### Dispatcher

**Plain words:** A small scheduled robot that looks at the open issues and starts the next one for the cloud agent, following simple rules (priority, dependencies, one at a time, no more than 3 PRs waiting).  
**In Tafsila:** `.github/workflows/dispatch.yml` runs `scripts/dispatch.mjs` when an issue becomes ready or a slot frees up (and every 6 hours as a safety net), at most `DISPATCH_DAILY_LIMIT` builds a day (default 4); pause it with the repo variable `DISPATCH_ENABLED=false` ([tutorial](../backend/tutorials/run-agents-in-cloud.md), ADR-016, ADR-017, ADR-020). **Card:** [Claude Code](tech/claude-code.md) · **Level:** intermediate  
**Learn:** <https://docs.github.com/en/actions/using-workflows/reusing-workflows>

<a id="docker"></a>

### Docker

**Plain words:** A tool that builds and runs [containers](#container).  
**In Tafsila:** `pnpm docker:build`, `compose.yaml`, `apps/web/Dockerfile` ([ADR-004](../DECISIONS.md)). **Card:** [Docker](tech/docker.md) · **Level:** beginner  
**Learn:** <https://docs.docker.com/get-started/>

<a id="docker-compose"></a>

### Docker Compose

**Plain words:** A file (`compose.yaml`) that starts several containers together with one command.  
**In Tafsila:** Starts the Inngest dev server by default; profiles `app`, `sim`, `tools` start more. **Card:** [Docker](tech/docker.md) · **Level:** intermediate  
**Learn:** <https://docs.docker.com/compose/>

<a id="docs-check"></a>

### docs:check

**Plain words:** A command (`pnpm docs:check`) that fails when a library has no technology card or a link inside `docs/` points nowhere.  
**In Tafsila:** `scripts/check-handbook.mjs`; runs inside `pnpm quality` and the Code quality workflow ([ADR-015](../DECISIONS.md)). **Card:** [Handbook checks](tech/handbook-checks.md) · **Level:** intermediate  
**Learn:** <https://lychee.cli.rs/>

<a id="domain"></a>

### Domain (layer)

**Plain words:** The part of the code that holds business rules and business errors, with no input or output.  
**In Tafsila:** `packages/api/src/domain/` (today `errors.ts`). **Level:** intermediate  
**Learn:** <https://martinfowler.com/bliki/DomainDrivenDesign.html>

<a id="dod"></a>

### DoR / DoD (Definition of Ready / Done)

**Plain words:** Two checklists. **Ready**: an issue may be started. **Done**: a pull request may be reviewed.  
**In Tafsila:** [WORKFLOW sections 4 and 5](../WORKFLOW.md). **Level:** beginner  
**Learn:** <https://scrumguides.org/scrum-guide.html>

<a id="drizzle"></a>

### Drizzle (ORM)

**Plain words:** A TypeScript library that lets code talk to a database with typed objects instead of raw SQL strings.  
**In Tafsila:** Listed in the tech stack ([SRS section 3.1](../SRS.md)); not installed yet. **Card:** [Drizzle](tech/drizzle.md) · **Level:** intermediate  
**Learn:** <https://orm.drizzle.team/docs/overview>

<a id="dxf"></a>

### DXF (AAMA)

**Plain words:** A file format used by industrial pattern-cutting plotters.  
**In Tafsila:** Optional export, priority "could" (FR-EXP-04). **Level:** advanced  
**Learn:** <https://en.wikipedia.org/wiki/AutoCAD_DXF>

<a id="letter-e"></a>

## E

<a id="e2e-test"></a>

### E2E (end-to-end) test

**Plain words:** A test that drives the real app like a user (click, type, read the screen) from start to finish.  
**In Tafsila:** Playwright, run with `pnpm test:e2e` in Arabic and English (planned; [SRS section 11](../SRS.md)). **Card:** [Playwright](tech/playwright.md) · **Level:** intermediate  
**Learn:** <https://playwright.dev/docs/intro>

<a id="ease"></a>

### Ease

**Plain words:** Extra room added to a body measurement for comfort or style. Arabic: راحة.  
**In Tafsila:** `EaseProfile` (`fitted`, `regular`, `loose`) in `measurements.ts`; ease tables live in `packages/engine/src/constants/` (planned). FR-VAL-03 checks that circumference equals measurement plus ease. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Ease_(sewing)>

<a id="egp"></a>

### EGP

**Plain words:** The Egyptian pound, the currency Tafsila charges in.  
**In Tafsila:** AI cost target is at most 5 EGP per pattern ([SRS section 9](../SRS.md)). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Egyptian_pound>

<a id="pdpl"></a>

### Egypt Personal Data Protection Law (Law 151 of 2020)

**Plain words:** The Egyptian law that governs how personal data such as photos and body measurements must be handled.  
**In Tafsila:** Drives private storage, signed URLs and delete-on-request ([SRS NFR-05](../SRS.md)). **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Personal_data>

<a id="endpoint"></a>

### Endpoint

**Plain words:** One address of the API that does one thing, such as `GET /api/health`.  
**In Tafsila:** Defined in `packages/api/src/routes/`. **Level:** beginner  
**Learn:** <https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview>

<a id="engine-strict"></a>

### engine-strict

**Plain words:** A pnpm/npm setting that turns a wrong Node version from a warning into an error.  
**In Tafsila:** `.npmrc` has `engine-strict=true`; see [troubleshooting](troubleshooting.md#pnpm-dev-fails-wrong-node-version). **Card:** [pnpm](tech/pnpm.md) · **Level:** intermediate  
**Learn:** <https://pnpm.io/npmrc#engine-strict>

<a id="engine-version"></a>

### engineVersion / ENGINE_VERSION

**Plain words:** A version number stamped on every pattern result so an old stored pattern can be redrawn exactly as it was.  
**In Tafsila:** `packages/engine/src/version.ts`; bump it whenever existing input would produce different geometry ([SRS NFR-08](../SRS.md)). **Level:** intermediate  
**Learn:** <https://semver.org/>

<a id="environment"></a>

### Environment (dev, preview, staging, prod)

**Plain words:** A separate copy of the running app with its own data and keys.  
**In Tafsila:** `local`, `ci`, `preview`, `staging`, `production` (`APP_ENVIRONMENTS` in `env.ts`); table in [WORKFLOW section 7](../WORKFLOW.md). **Level:** beginner  
**Learn:** <https://12factor.net/dev-prod-parity>

<a id="env-var"></a>

### Environment variable (env var)

**Plain words:** A named setting given to a program from outside the code, such as a URL or secret key.  
**In Tafsila:** Declared and validated only in `packages/config/src/env.ts`; examples in `.env.example`. Secrets never go in code ([CLAUDE.md](../../CLAUDE.md) rule 6). **Card:** [Zod](tech/zod.md) · **Level:** beginner  
**Learn:** <https://12factor.net/config>

<a id="eslint"></a>

### ESLint

**Plain words:** A tool that reads code and reports style and bug risks.  
**In Tafsila:** `pnpm lint`; config `eslint.config.mjs` enforces [CODING_STANDARDS](../CODING_STANDARDS.md). **Card:** [ESLint](tech/eslint-prettier.md) · **Level:** beginner  
**Learn:** <https://eslint.org/docs/latest/>

<a id="exif"></a>

### EXIF

**Plain words:** Hidden data in photos (camera, time, sometimes GPS location).  
**In Tafsila:** Stripped before upload for privacy ([SRS section 9](../SRS.md)). **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Exif>

<a id="exit-path"></a>

### Exit path

**Plain words:** A planned way to leave a vendor or tool later without rewriting the product.  
**In Tafsila:** Vercel can be replaced by our Docker image; Supabase is standard Postgres; services use ports so adapters can change ([ADR-004](../DECISIONS.md), [ADR-003](../DECISIONS.md)). See [lock-in](#lock-in). **Card:** [Vercel](tech/vercel.md) · **Level:** beginner

<a id="letter-f"></a>

## F

<a id="fabric-width"></a>

### Fabric width

**Plain words:** How wide the roll of fabric is (commonly 90, 115, 140, 150 or 160 cm). It limits how pieces can be placed.  
**In Tafsila:** Chosen by the user for yardage (FR-FAB-01). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Textile>

<a id="facing"></a>

### Facing and interfacing

**Plain words:** A facing is a shaped piece that finishes a raw edge such as a neckline from the inside. Interfacing is a stiffening layer fused or sewn to a piece (collars, waistbands).  
**In Tafsila:** Cut `fabric` kinds: `main`, `lining`, `interfacing`; facings generated where needed (FR-PAT-07). **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Interfacing>

<a id="fastapi"></a>

### FastAPI

**Plain words:** A Python web framework for APIs.  
**In Tafsila:** Planned for `services/sim`. **Card:** [Python, FastAPI and GarmentCode](tech/python-fastapi-garmentcode.md) · **Level:** intermediate  
**Learn:** <https://fastapi.tiangolo.com/>

<a id="fast-check"></a>

### fast-check

**Plain words:** A library that generates many random inputs to test a rule, then shrinks any failure to a small example.  
**In Tafsila:** Planned for every FR-VAL rule across the size matrix ([engine docs](../engine/README.md)). **Card:** [fast-check](tech/fast-check.md) · **Level:** advanced  
**Learn:** <https://fast-check.dev/docs/introduction/>

<a id="fawry"></a>

### Fawry

**Plain words:** An Egyptian payment network where a customer pays in cash or at a kiosk with a reference code.  
**In Tafsila:** Supported through Paymob ([SRS section 3.1](../SRS.md)). **Card:** [Paymob](tech/paymob-fawry.md) · **Level:** beginner  
**Learn:** <https://developers.paymob.com/>

<a id="feature-flag"></a>

### Feature flag

**Plain words:** A switch that turns a feature on or off without redeploying.  
**In Tafsila:** PostHog flags read through `useFeatureFlag` in `apps/web/src/shared/analytics` (first flag: `signups_open`, not gating anything until M1). **Card:** [PostHog](tech/sentry-posthog.md) · **Level:** intermediate  
**Learn:** <https://posthog.com/docs/feature-flags>

<a id="feature-module"></a>

### Feature module

**Plain words:** An engine plugin for one garment feature, such as a V neckline. It changes the drawing only when the design asks for it.  
**In Tafsila:** Contract in [ARCHITECTURE section 3](../ARCHITECTURE.md); implemented modules are listed in [engine docs](../engine/README.md) (none yet). See [plugin pipeline](patterns/functional-core-plugin-pipeline.md). **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Open%E2%80%93closed_principle>

<a id="feature-sliced"></a>

### Feature-sliced design

**Plain words:** Organising frontend code by user-facing feature, with strict import directions.  
**In Tafsila:** `apps/web/src/features/` (planned). See [feature-sliced frontend](patterns/feature-sliced-frontend.md). **Level:** intermediate  
**Learn:** <https://feature-sliced.design/docs/get-started/overview>

<a id="fit"></a>

### Fit (fitted, semi-fitted, loose)

**Plain words:** How close the garment sits to the body.  
**In Tafsila:** `bodice.fit` values `fitted`, `semi-fitted`, `loose`. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Sewing_pattern>

<a id="fixture"></a>

### Fixture

**Plain words:** Ready-made test data shared by many tests.  
**In Tafsila:** `packages/test-fixtures` (sizes, measurements, designs such as `vNeckHalfCircleDress`). **Card:** [Vitest](tech/vitest.md) · **Level:** beginner  
**Learn:** <https://vitest.dev/guide/test-context>

<a id="formatting"></a>

### Formatting

**Plain words:** Automatic layout of code (spaces, quotes, line breaks) so diffs show real changes only.  
**In Tafsila:** Prettier on commit and in CI (`pnpm format:check`). **Card:** [Prettier](tech/eslint-prettier.md) · **Level:** beginner  
**Learn:** <https://prettier.io/docs/>

<a id="freesewing"></a>

### FreeSewing

**Plain words:** An open-source JavaScript project that publishes parametric sewing patterns.  
**In Tafsila:** The planned basis for the engine's drafting methods; licence verified as MIT on 2026-10-07, see the [card](tech/freesewing.md) ([SRS section 1.4 and 13](../SRS.md)). **Card:** [FreeSewing](tech/freesewing.md) · **Level:** intermediate  
**Learn:** <https://freesewing.eu/docs/about/>

<a id="fine-grained-pat"></a>

### Fine-grained personal access token

**Plain words:** A GitHub password-like token that you limit to one repository and a few permissions, and that expires.  
**In Tafsila:** `AGENT_GITHUB_TOKEN` lets the cloud agent push branches and open PRs (contents, pull requests, issues: read/write). PRs opened with the default `GITHUB_TOKEN` do not start CI, which is why a personal token is needed ([tutorial](../backend/tutorials/run-agents-in-cloud.md), ADR-016). **Card:** [GitHub Actions](tech/github.md) · **Level:** intermediate  
**Learn:** <https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens>

<a id="letter-g"></a>

## G

<a id="garmentcode"></a>

### GarmentCode

**Plain words:** A research framework for programmatic sewing patterns with cloth simulation.  
**In Tafsila:** Basis for the v2 `services/sim` ([SRS section 1.4](../SRS.md)). **Card:** [Python, FastAPI and GarmentCode](tech/python-fastapi-garmentcode.md) · **Level:** advanced  
**Learn:** <https://arxiv.org/html/2306.03642v2>

<a id="ghcr"></a>

### GHCR (GitHub Container Registry)

**Plain words:** GitHub's storage for Docker images.  
**In Tafsila:** The `Docker image` workflow pushes `ghcr.io/<owner>/tafsila-web` (`.github/workflows/docker.yml`). **Card:** [Docker](tech/docker.md) · **Level:** intermediate  
**Learn:** <https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry>

<a id="git"></a>

### Git

**Plain words:** The tool that records every change to the code so you can go back and work in parallel on [branches](#branch).  
**In Tafsila:** The whole workflow is Git plus GitHub ([WORKFLOW.md](../WORKFLOW.md)). **Level:** beginner  
**Learn:** <https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F>

<a id="github-actions"></a>

### GitHub Actions

**Plain words:** GitHub's built-in robot runner: workflows in `.github/workflows/` run on pushes and pull requests.  
**In Tafsila:** See [CI/CD](#ci-cd). **Card:** [GitHub Actions](tech/github.md) · **Level:** beginner  
**Learn:** <https://docs.github.com/en/actions>

<a id="grading"></a>

### Grading

**Plain words:** Scaling one pattern up or down into other sizes using fixed rules.  
**In Tafsila:** Tafsila drafts each size directly from measurements instead of grading; multi-size grading export is out of scope ([SRS section 1.2](../SRS.md)). **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Pattern_grading>

<a id="grainline"></a>

### Grainline (grain line)

**Plain words:** An arrow on a pattern piece showing how to align it with the fabric's straight grain (parallel to the selvedge). Arabic: اتجاه القماش.  
**In Tafsila:** `Piece.grainLine`; FR-VAL-06 requires one on every piece. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Sewing_pattern>

<a id="letter-h"></a>

## H

<a id="hadolint"></a>

### hadolint

**Plain words:** A linter for Dockerfiles.  
**In Tafsila:** Runs in the `Docker image` workflow; see [troubleshooting](troubleshooting.md#hadolint-dl3018-fails-the-docker-ci-job) and [ADR-007](../DECISIONS.md). **Card:** [Docker](tech/docker.md) · **Level:** intermediate  
**Learn:** <https://github.com/hadolint/hadolint>

<a id="healthcheck"></a>

### Health check

**Plain words:** A tiny endpoint or command that answers "is the app alive?".  
**In Tafsila:** `GET /api/health` (`packages/api/src/routes/health.ts`); used by the Docker `HEALTHCHECK`, CI smoke tests and uptime monitors. **Card:** [Hono](tech/hono.md) · **Level:** beginner  
**Learn:** <https://docs.docker.com/reference/dockerfile/#healthcheck>

<a id="heic"></a>

### HEIC

**Plain words:** The photo format iPhones use by default.  
**In Tafsila:** Photo upload must accept it ([SRS section 4.3](../SRS.md)). **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/High_Efficiency_Image_File_Format>

<a id="hem"></a>

### Hem

**Plain words:** The finished bottom edge of a garment, folded and stitched.  
**In Tafsila:** Default hem seam allowance is 30 mm ([engine docs](../engine/README.md)). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Hem>

<a id="hexagonal"></a>

### Hexagonal architecture

**Plain words:** See [ports and adapters](#ports-and-adapters).  
**In Tafsila:** Pattern page: [hexagonal](patterns/hexagonal-ports-adapters.md). **Level:** intermediate  
**Learn:** <https://alistair.cockburn.us/hexagonal-architecture/>

<a id="hmac"></a>

### HMAC

**Plain words:** A signature made from a message and a shared secret, proving the message came from someone who knows the secret and was not changed.  
**In Tafsila:** Used to verify payment webhooks (planned; [SRS NFR-04](../SRS.md)). **Level:** advanced  
**Learn:** <https://en.wikipedia.org/wiki/HMAC>

<a id="hono"></a>

### Hono

**Plain words:** A small, fast web framework for writing HTTP APIs in TypeScript.  
**In Tafsila:** `packages/api` builds a Hono app (`createApp`) that Next.js mounts at `/api` ([ADR-005](../DECISIONS.md)). **Card:** [Hono](tech/hono.md) · **Level:** intermediate  
**Learn:** <https://hono.dev/docs/>

<a id="hook"></a>

### Hook (Claude Code)

**Plain words:** A command Claude Code runs automatically at a fixed moment, such as after every file edit or before the agent finishes; its output can be shown to the agent or stop it.  
**In Tafsila:** `.claude/settings.json`: [SessionStart](#sessionstart-hook) installs dependencies in the cloud; PostToolUse runs Prettier and `eslint --fix` on the edited file only; Stop runs the [affected](#affected-build) typecheck and tests and sends the agent back when they fail (ADR-017). **Card:** [Claude Code](tech/claude-code.md) · **Level:** intermediate  
**Learn:** <https://docs.claude.com/en/docs/claude-code/hooks>

<a id="http"></a>

### HTTP

**Plain words:** The language browsers and servers use to talk: a request (method, address) gets a response (status code, body).  
**In Tafsila:** Everything between the browser and `packages/api`. See [request journey](map/request-journey.md). **Level:** beginner  
**Learn:** <https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview>

<a id="husky"></a>

### Husky and lint-staged

**Plain words:** Husky runs a script on Git events; lint-staged runs formatters and linters only on the files you are committing.  
**In Tafsila:** `.husky/pre-commit` runs `lint-staged`; config in `package.json`. **Card:** [Husky and lint-staged](tech/husky-lint-staged.md) · **Level:** intermediate  
**Learn:** <https://typicode.github.io/husky/>

<a id="letter-i"></a>

## I

<a id="i18n"></a>

### i18n (internationalisation)

**Plain words:** Building an app so it can show several languages ("i" + 18 letters + "n").  
**In Tafsila:** Arabic (default) and English via `messages/{ar,en}.json` (planned, next-intl). **Card:** [next-intl](tech/next-intl.md) · **Level:** intermediate  
**Learn:** <https://developer.mozilla.org/en-US/docs/Glossary/Internationalization>

<a id="idempotency"></a>

### Idempotency

**Plain words:** Doing the same request twice has the same effect as doing it once.  
**In Tafsila:** Payment webhooks are idempotent by `paymob_order_id` so a repeated message cannot credit twice ([ARCHITECTURE section 2](../ARCHITECTURE.md)). **Level:** advanced  
**Learn:** <https://developer.mozilla.org/en-US/docs/Glossary/Idempotent>

<a id="inngest"></a>

### Inngest

**Plain words:** A service that runs background jobs (work that should not block a web request).  
**In Tafsila:** Dev server in `compose.yaml`; jobs in `packages/api/src/jobs/` (planned). **Card:** [Inngest](tech/inngest.md) · **Level:** intermediate  
**Learn:** <https://www.inngest.com/docs>

<a id="issue"></a>

### Issue

**Plain words:** A GitHub ticket describing one piece of work with scope and acceptance criteria.  
**In Tafsila:** All work starts from an issue ([CLAUDE.md](../../CLAUDE.md) rule 1). **Level:** beginner  
**Learn:** <https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues>

<a id="letter-j"></a>

## J

<a id="jscpd"></a>

### jscpd

**Plain words:** A tool that finds copy-pasted code.  
**In Tafsila:** `pnpm jscpd` (config `.jscpd.json`: 50 tokens, 5 lines). **Card:** [jscpd and dependency-cruiser](tech/jscpd-dependency-cruiser.md) · **Level:** intermediate  
**Learn:** <https://github.com/kucherenko/jscpd>

<a id="jsdoc"></a>

### JSDoc

**Plain words:** A comment format (`/** ... */`) that documents what a function is for, its parameters and return value.  
**In Tafsila:** Required on every function, component, class and type ([CODING_STANDARDS section 5](../CODING_STANDARDS.md)). See [code style](code-style.md). **Card:** [ESLint](tech/eslint-prettier.md) · **Level:** beginner  
**Learn:** <https://jsdoc.app/>

<a id="json"></a>

### JSON

**Plain words:** A plain-text format for structured data: `{ "name": "Dress", "sizes": [38, 40] }`.  
**In Tafsila:** Every API body, `DesignSpec` and `PatternResult` is JSON. **Level:** beginner  
**Learn:** <https://developer.mozilla.org/en-US/docs/Glossary/JSON>

<a id="json-schema"></a>

### JSON Schema

**Plain words:** A standard way to describe what valid JSON looks like.  
**In Tafsila:** Generated from the Zod schemas for the Python sim service and AI structured output ([ARCHITECTURE section 4](../ARCHITECTURE.md)). **Card:** [Zod](tech/zod.md) · **Level:** advanced  
**Learn:** <https://json-schema.org/understanding-json-schema>

<a id="jsx"></a>

### JSX / TSX

**Plain words:** A way of writing HTML-like markup inside JavaScript (`.jsx`) or TypeScript (`.tsx`) files.  
**In Tafsila:** All React components, such as `packages/ui/src/button.tsx`. **Card:** [React](tech/react.md) · **Level:** beginner  
**Learn:** <https://react.dev/learn/writing-markup-with-jsx>

<a id="jwt"></a>

### JWT (JSON Web Token)

**Plain words:** A signed token that proves who the user is; the server checks the signature instead of asking the database each time.  
**In Tafsila:** Supabase issues it; API auth middleware verifies it (planned, M1). **Card:** [Supabase](tech/supabase.md) · **Level:** intermediate  
**Learn:** <https://jwt.io/introduction>

<a id="letter-k"></a>

## K

<a id="keystone"></a>

### Keystone correction

**Plain words:** Adjusting a projected image so a trapezoid caused by an angled projector becomes a rectangle again.  
**In Tafsila:** FR-PROJ-06 (priority "could") with 4-corner adjustment. **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Keystone_effect>

<a id="letter-l"></a>

## L

<a id="label-placement"></a>

### Label placement (polylabel)

**Plain words:** Choosing where to print a piece's name and info so it fits inside the piece without hitting lines. `polylabel` finds the point farthest from the edges.  
**In Tafsila:** Pipeline step 5, `layout` ([ARCHITECTURE section 3](../ARCHITECTURE.md)). **Level:** advanced  
**Learn:** <https://github.com/mapbox/polylabel>

<a id="layer-arch"></a>

### Layer (architecture)

**Plain words:** A level of the code with one job (routes, services, domain, ports, adapters) and rules about who may call whom.  
**In Tafsila:** Dependencies point inward ([CODING_STANDARDS section 1](../CODING_STANDARDS.md)). **Level:** intermediate  
**Learn:** <https://martinfowler.com/bliki/PresentationDomainDataLayering.html>

<a id="layer"></a>

### Layer (Docker)

**Plain words:** One step of an image build, cached so unchanged steps are skipped on the next build.  
**In Tafsila:** See [multi-stage build](#multi-stage-build). Not the same as an architecture layer. **Card:** [Docker](tech/docker.md) · **Level:** intermediate  
**Learn:** <https://docs.docker.com/build/cache/>

<a id="lcp"></a>

### LCP and p95

**Plain words:** LCP (Largest Contentful Paint) is how long the main content takes to show. p95 means 95 percent of requests are at least this fast.  
**In Tafsila:** Targets: LCP under 2.5 s on 4G, AI analysis under 30 s at p95 ([SRS NFR-02](../SRS.md)). **Level:** intermediate  
**Learn:** <https://web.dev/articles/lcp>

<a id="ledger"></a>

### Ledger

**Plain words:** A list where entries are only ever added, never edited, so history cannot be rewritten.  
**In Tafsila:** Credits are an append-only ledger ([ARCHITECTURE section 5](../ARCHITECTURE.md)). **Card:** [Supabase](tech/supabase.md) · **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Ledger>

<a id="lining"></a>

### Lining

**Plain words:** An inner layer of fabric that hides seams and makes a garment feel smooth.  
**In Tafsila:** `DesignSpec.lining` is a boolean. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Lining_(sewing)>

<a id="linting"></a>

### Linting

**Plain words:** Automatic checking of code for mistakes and style rule violations.  
**In Tafsila:** `pnpm lint` (ESLint, zero warnings allowed). **Card:** [ESLint](tech/eslint-prettier.md) · **Level:** beginner  
**Learn:** <https://eslint.org/docs/latest/>

<a id="llm"></a>

### LLM and token (AI)

**Plain words:** A large language model is an AI trained on text (and images). A token is a small piece of text it reads or writes; usage and cost are counted in tokens.  
**In Tafsila:** Token-saving rules in [WORKFLOW section 2](../WORKFLOW.md); the model analyses photos ([SRS section 9](../SRS.md)). **Level:** beginner  
**Learn:** <https://docs.claude.com/en/docs/build-with-claude/overview>

<a id="lock-in"></a>

### Lock-in

**Plain words:** When switching away from a vendor or tool would cost so much that you are stuck with it.  
**In Tafsila:** We avoid it with ports and adapters, standard formats (Postgres, Docker images, web-standard `Request`/`Response`) and an [exit path](#exit-path) per vendor. **Card:** [Supabase](tech/supabase.md) · **Level:** beginner

<a id="lockfile"></a>

### Lockfile

**Plain words:** A file that records the exact version of every installed dependency so every machine installs the same thing.  
**In Tafsila:** `pnpm-lock.yaml`. CI installs with `--frozen-lockfile`. **Card:** [pnpm](tech/pnpm.md) · **Level:** beginner  
**Learn:** <https://pnpm.io/git#lockfiles>

<a id="css-logical"></a>

### Logical CSS properties

**Plain words:** CSS that says `start` and `end` instead of `left` and `right`, so one layout works in left-to-right and right-to-left languages.  
**In Tafsila:** Tailwind classes `ms-*`, `me-*`, `ps-*`, `pe-*` ([frontend docs](../frontend/README.md)). **Card:** [Tailwind CSS](tech/tailwind.md) · **Level:** intermediate  
**Learn:** <https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values>

<a id="lychee"></a>

### lychee

**Plain words:** A tool that visits every web link in the docs and reports the ones that are dead.  
**In Tafsila:** `.github/workflows/docs-links.yml`: runs on pull requests that touch `docs/**` (a warning, never blocking) and every Monday (opens an issue if links are broken). **Card:** [Handbook checks](tech/handbook-checks.md) · **Level:** intermediate  
**Learn:** <https://lychee.cli.rs/>

<a id="letter-m"></a>

## M

<a id="mail-catcher"></a>

### Mail catcher

**Plain words:** A fake inbox that catches every email the app sends while you develop, so nothing real is ever sent.  
**In Tafsila:** Mailpit, started with local Supabase at http://127.0.0.1:54324; sign-up confirmation and password-reset emails appear there ([run locally](../backend/tutorials/run-locally.md)). **Level:** beginner  
**Learn:** <https://mailpit.axllent.org/>

<a id="magic-number"></a>

### Magic number

**Plain words:** A number in code with no explanation of what it is.  
**In Tafsila:** Forbidden: use a named constant with a unit, such as `MIN_CAP_HEIGHT_MM`. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Magic_number_(programming)>

<a id="test-otp"></a>

### Test OTP

**Plain words:** A phone number with a fixed login code, so you can test phone sign-in without sending a real SMS.  
**In Tafsila:** `[auth.sms.test_otp]` in `supabase/config.toml`: `+201000000001`, `+201000000002`, `+201000000003`, code `123456`; works only locally and in non-production environments. **Level:** beginner  
**Learn:** <https://supabase.com/docs/guides/auth/phone-login>

<a id="test-case"></a>

### Manual test case

**Plain words:** A written scenario (steps, expected result) a person runs by hand.  
**In Tafsila:** `docs/test-cases/<area>/<issue>-<slug>.md`, indexed by `scripts/test-case-index.sh`. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Test_case>

<a id="measurements"></a>

### Measurements

**Plain words:** The body measurements (bust, waist, hip, arm length...) used to draft a pattern, always in millimetres.  
**In Tafsila:** `measurementsSchema` in `packages/schemas/src/measurements.ts`; saved per client profile. **Card:** [Zod](tech/zod.md) · **Level:** beginner  
**Learn:** <https://freesewing.org/docs/measurements/>

<a id="memory-adapter"></a>

### Memory adapter (fake)

**Plain words:** An adapter that keeps data in memory instead of a real database, used in tests.  
**In Tafsila:** `packages/api/src/adapters/memory/` (planned); today tests use a fixed clock. **Level:** intermediate  
**Learn:** <https://martinfowler.com/bliki/TestDouble.html>

<a id="milestone-brief"></a>

### Milestone brief and wave

**Plain words:** A one-page plan for a milestone (goal, scope, deliverables, exit criteria, risks, issue list). A wave is the group of its issues whose dependencies are all closed, so they can be planned and built next.  
**In Tafsila:** `docs/milestones/`, written with `/plan-milestone`; the next wave is planned with `/plan-wave` ([WORKFLOW section 8](../WORKFLOW.md#8-github-board-and-milestones), [ADR-024](../DECISIONS.md)). **Level:** beginner  
**Learn:** <https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/about-milestones>

<a id="mermaid"></a>

### Mermaid

**Plain words:** A text format that GitHub draws as diagrams.  
**In Tafsila:** Used for every diagram in this handbook. **Level:** beginner  
**Learn:** <https://mermaid.js.org/intro/>

<a id="middleware"></a>

### Middleware

**Plain words:** Code that runs on every request before (or after) the route, for example login checks or logging.  
**In Tafsila:** `packages/api/src/middleware/` (today the error handler). Not the same as Next.js `middleware.ts`. **Card:** [Hono](tech/hono.md) · **Level:** intermediate  
**Learn:** <https://hono.dev/docs/guides/middleware>

<a id="migration"></a>

### Migration

**Plain words:** A versioned script that changes the database structure, kept in Git.  
**In Tafsila:** `supabase/migrations/` (empty until M1); applied by CI; how-to in `docs/backend/tutorials/add-migration.md`. **Card:** [Supabase](tech/supabase.md) · **Level:** intermediate  
**Learn:** <https://supabase.com/docs/guides/deployment/database-migrations>

<a id="milestone"></a>

### Milestone

**Plain words:** A GitHub group of issues for one delivery stage (M0 to M9 and Post-launch).  
**In Tafsila:** Map in [WORKFLOW section 8](../WORKFLOW.md); plan in [SRS section 12](../SRS.md). **Level:** beginner  
**Learn:** <https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/about-milestones>

<a id="mm-units"></a>

### Millimetres (units rule)

**Plain words:** The engine's only length unit. The UI shows centimetres and converts.  
**In Tafsila:** `cmToMm` and `mmToCm` in `packages/utils/src/units.ts`; names carry the unit, for example `lengthMm`. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Millimetre>

<a id="modular-monolith"></a>

### Modular monolith

**Plain words:** One deployable app made of parts with enforced borders.  
**In Tafsila:** See [modular monolith](patterns/modular-monolith.md). **Level:** intermediate  
**Learn:** <https://martinfowler.com/bliki/MonolithFirst.html>

<a id="monorepo"></a>

### Monorepo

**Plain words:** One Git repository holding several apps and packages.  
**In Tafsila:** The whole of Tafsila ([ADR-005](../DECISIONS.md)). **Card:** [Turborepo](tech/turborepo.md) · **Level:** beginner  
**Learn:** <https://monorepo.tools/>

<a id="multi-stage-build"></a>

### Multi-stage build

**Plain words:** A Dockerfile with several `FROM` steps: build in a big stage, copy only the results into a small final image.  
**In Tafsila:** `apps/web/Dockerfile`: `base`, `pruner`, `deps`, `builder`, `runner`. **Card:** [Docker](tech/docker.md) · **Level:** intermediate  
**Learn:** <https://docs.docker.com/build/building/multi-stage/>

<a id="mvp"></a>

### MVP (minimum viable product)

**Plain words:** The smallest version that is useful to real users.  
**In Tafsila:** Release 1: dress, skirt, blouse, woven fabrics ([SRS section 1.2](../SRS.md)). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Minimum_viable_product>

<a id="letter-n"></a>

## N

<a id="nap"></a>

### Nap (directional fabric)

**Plain words:** A fabric whose surface looks different when turned upside down (velvet, some prints), so all pieces must face the same way.  
**In Tafsila:** User answers "directional nap yes/no" for yardage (FR-FAB-01). **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Nap_(textile)>

<a id="neckline"></a>

### Neckline (v, square, sweetheart, boat, round)

**Plain words:** The shape of the opening around the neck. V comes to a point; square has straight corners; sweetheart is heart-shaped; boat is wide and shallow; high-round sits close to the neck.  
**In Tafsila:** `neckline.front` and `neckline.back` enums in `design-spec.ts`; depth in `depthFrontMm`. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Neckline>

<a id="nesting"></a>

### Nesting / marker

**Plain words:** Arranging all pattern pieces on a given fabric width to use as little fabric as possible. The resulting layout is called a marker.  
**In Tafsila:** Planned `packages/nesting` run in a Web Worker ([SRS section 4.10](../SRS.md)). **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Sewing_pattern>

<a id="next-intl"></a>

### next-intl

**Plain words:** A library that adds translations and locale routing to Next.js.  
**In Tafsila:** Planned for `ar` (default) and `en`. **Card:** [next-intl](tech/next-intl.md) · **Level:** intermediate  
**Learn:** <https://next-intl.dev/docs/getting-started>

<a id="nextjs"></a>

### Next.js

**Plain words:** A React framework that provides routing, server rendering and API route handlers.  
**In Tafsila:** `apps/web`. See [App Router](#app-router). **Card:** [Next.js](tech/nextjs.md) · **Level:** beginner  
**Learn:** <https://nextjs.org/docs>

<a id="node"></a>

### Node.js

**Plain words:** A program that runs JavaScript outside the browser.  
**In Tafsila:** Required version `>=22.22.2 <23` (`package.json` engines, `.nvmrc`). **Card:** [Node.js](tech/nodejs.md) · **Level:** beginner  
**Learn:** <https://nodejs.org/en/learn/getting-started/introduction-to-nodejs>

<a id="notch"></a>

### Notch

**Plain words:** A small mark on the edge of a piece that must meet the matching mark on the piece it is sewn to. Arabic: علامة تطابق.  
**In Tafsila:** `Piece.notches`; FR-VAL-04 checks matching notches are at the same distance (within 2 mm). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Sewing_pattern>

<a id="nvm"></a>

### nvm (Node Version Manager)

**Plain words:** A tool that installs several Node versions and switches between them per terminal.  
**In Tafsila:** `nvm use` reads `.nvmrc`; see [troubleshooting](troubleshooting.md#pnpm-dev-fails-wrong-node-version). **Card:** [Node.js](tech/nodejs.md) · **Level:** beginner  
**Learn:** <https://github.com/nvm-sh/nvm>

<a id="letter-o"></a>

## O

<a id="openapi"></a>

### OpenAPI

**Plain words:** A standard file format describing every endpoint of an API.  
**In Tafsila:** Generated from the routes (`pnpm api:openapi`, planned) and shown at `/api/docs`; feeds the Postman collection. **Card:** [Hono](tech/hono.md) · **Level:** intermediate  
**Learn:** <https://spec.openapis.org/oas/latest.html>

<a id="orm"></a>

### ORM

**Plain words:** A library that maps database rows to objects in code.  
**In Tafsila:** See [Drizzle](#drizzle). **Card:** [Drizzle](tech/drizzle.md) · **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Object-relational_mapping>

<a id="otp"></a>

### OTP (one-time password)

**Plain words:** A short code sent by SMS that proves you own a phone number.  
**In Tafsila:** Phone login via Supabase Auth ([SRS section 4.1](../SRS.md), M1). **Card:** [Supabase](tech/supabase.md) · **Level:** beginner  
**Learn:** <https://supabase.com/docs/guides/auth/phone-login>

<a id="letter-p"></a>

## P

<a id="package"></a>

### Package

**Plain words:** A folder of code with its own `package.json`, usable by other code.  
**In Tafsila:** `@tafsila/api`, `@tafsila/engine`, `@tafsila/schemas` and others under `packages/`. **Card:** [pnpm](tech/pnpm.md) · **Level:** beginner  
**Learn:** <https://docs.npmjs.com/about-packages-and-modules>

<a id="pattern-piece"></a>

### Pattern piece

**Plain words:** One shape to cut from fabric (front bodice, sleeve, skirt panel).  
**In Tafsila:** The `Piece` interface in the `PatternResult` ([SRS section 6.3](../SRS.md)). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Sewing_pattern>

<a id="pattern-version"></a>

### Pattern version

**Plain words:** An immutable saved snapshot of design, measurements and engine version, plus its output.  
**In Tafsila:** Chat edits create new versions; none is ever changed ([SRS section 1.3](../SRS.md)). **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Version_control>

<a id="pattern-result"></a>

### PatternResult

**Plain words:** The JSON the engine returns: pieces, sewing order, validation report, engine version and metadata. Every output (viewer, projector, PDF) reads it.  
**In Tafsila:** [SRS section 6.3](../SRS.md); not in code yet. See [pattern journey](map/pattern-journey.md). **Level:** intermediate  
**Learn:** <https://json-schema.org/understanding-json-schema>

<a id="paymob"></a>

### Paymob

**Plain words:** An Egyptian payment provider (cards, mobile wallets, Fawry reference codes).  
**In Tafsila:** Behind a `PaymentGateway` port; `PAYMOB_MODE` is `sandbox` or `live` ([SRS section 4.14](../SRS.md)). **Card:** [Paymob](tech/paymob-fawry.md) · **Level:** intermediate  
**Learn:** <https://developers.paymob.com/>

<a id="pdf-tiling"></a>

### PDF tiling (A4, A0)

**Plain words:** Printing a large pattern on many A4 sheets that you tape together, or as a single large A0 sheet at a copy shop.  
**In Tafsila:** FR-EXP-01 and FR-EXP-02; the A4 export includes a 10 cm test square, overlap marks and a page map. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/ISO_216>

<a id="pdf-lib"></a>

### pdf-lib

**Plain words:** A JavaScript library that creates PDF files.  
**In Tafsila:** Planned for the A4 and A0 exports. **Level:** intermediate  
**Learn:** <https://pdf-lib.js.org/>

<a id="plan"></a>

### Plan (issue plan)

**Plain words:** A comment or file describing how an issue will be built: files, steps, tests, risks.  
**In Tafsila:** `docs/plans/<N>-<slug>.md`; `plan:none` means the issue itself is the plan ([WORKFLOW section 2](../WORKFLOW.md)). **Level:** beginner  
**Learn:** <https://docs.claude.com/en/docs/claude-code/common-workflows>

<a id="playwright"></a>

### Playwright

**Plain words:** A tool that controls a real browser to run end-to-end tests.  
**In Tafsila:** See [E2E test](#e2e-test). **Card:** [Playwright](tech/playwright.md) · **Level:** intermediate  
**Learn:** <https://playwright.dev/docs/intro>

<a id="pnpm"></a>

### pnpm

**Plain words:** A package manager that installs dependencies fast and shares them between projects.  
**In Tafsila:** The only package manager used here (`packageManager: pnpm@10.34.6`). **Card:** [pnpm](tech/pnpm.md) · **Level:** beginner  
**Learn:** <https://pnpm.io/motivation>

<a id="pockets"></a>

### Pockets (side-seam, patch)

**Plain words:** Side-seam pockets hide inside the side seam; patch pockets are sewn onto the outside.  
**In Tafsila:** `DesignSpec.pockets` is a list of `side-seam` or `patch`. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Pocket>

<a id="port"></a>

### Port

**Plain words:** An interface that says what the business logic needs from the outside world, without saying how it is done.  
**In Tafsila:** `packages/api/src/ports/` (today `clock.ts`). See [hexagonal](patterns/hexagonal-ports-adapters.md). **Level:** intermediate  
**Learn:** <https://alistair.cockburn.us/hexagonal-architecture/>

<a id="ports-and-adapters"></a>

### Ports and adapters

**Plain words:** Another name for hexagonal architecture: business rules talk to ports, adapters plug real tools into them.  
**In Tafsila:** See [hexagonal](patterns/hexagonal-ports-adapters.md). **Level:** intermediate  
**Learn:** <https://alistair.cockburn.us/hexagonal-architecture/>

<a id="postgres"></a>

### Postgres (PostgreSQL)

**Plain words:** A widely used relational database that stores data in tables.  
**In Tafsila:** Provided by Supabase ([SRS section 7](../SRS.md)). **Card:** [Supabase](tech/supabase.md) · **Level:** beginner  
**Learn:** <https://www.postgresql.org/docs/current/tutorial.html>

<a id="posthog"></a>

### PostHog

**Plain words:** A product-analytics and feature-flag service.  
**In Tafsila:** Planned, wrapped in `shared/analytics` ([ARCHITECTURE section 6](../ARCHITECTURE.md)). **Card:** [PostHog](tech/sentry-posthog.md) · **Level:** intermediate  
**Learn:** <https://posthog.com/docs>

<a id="postman"></a>

### Postman and Newman

**Plain words:** Postman is an app for trying API requests; Newman runs a Postman collection from the command line (and in CI).  
**In Tafsila:** `postman/` folder; `compose.yaml` profile `tools` runs Newman. **Card:** [Postman and Newman](tech/postman-newman.md) · **Level:** beginner  
**Learn:** <https://learning.postman.com/docs/>

<a id="prettier"></a>

### Prettier

**Plain words:** A tool that formats code automatically.  
**In Tafsila:** See [formatting](#formatting). **Card:** [Prettier](tech/eslint-prettier.md) · **Level:** beginner  
**Learn:** <https://prettier.io/docs/>

<a id="preview-deployment"></a>

### Preview deployment

**Plain words:** A temporary copy of the app built for one pull request so it can be tried before merging.  
**In Tafsila:** Link posted by Vercel on the PR ([WORKFLOW section 7](../WORKFLOW.md)); it reports `environment: preview` on `/api/health` and shares the staging database. **Card:** [Vercel](tech/vercel.md) · **Level:** beginner  
**Learn:** <https://vercel.com/docs/deployments/environments>

<a id="princess-seam"></a>

### Princess seam

**Plain words:** A long curved seam from the shoulder or armhole down over the bust that shapes the garment without darts.  
**In Tafsila:** `bodice.shaping` values `princess-shoulder` and `princess-armhole`. **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Princess_line>

<a id="projector-mode"></a>

### Projector mode

**Plain words:** Displaying the pattern 1:1 on the fabric with a projector, so you cut along the light.  
**In Tafsila:** FR-PROJ-01 to FR-PROJ-06 ([SRS section 4.7](../SRS.md)); needs [calibration](#calibration). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Sewing_pattern>

<a id="prompt-cache"></a>

### Prompt cache (cache hit ratio)

**Plain words:** Claude re-reads the same conversation on every turn; the parts it has already seen are served from a cache that is much cheaper and faster. The cache hit ratio is the share of input tokens that came from that cache.  
**In Tafsila:** `cache_hit_ratio` in each usage record; the weekly report flags runs below 50%, which usually means many short runs or a context that keeps changing. **Card:** [Claude Code](tech/claude-code.md#measuring-agent-usage) · **Level:** intermediate  
**Learn:** <https://docs.claude.com/en/docs/build-with-claude/prompt-caching>

<a id="property-based-test"></a>

### Property-based test

**Plain words:** A test that states a rule ("every generated pattern has closed outlines") and checks it against many generated inputs.  
**In Tafsila:** Required for engine validation rules ([CLAUDE.md](../../CLAUDE.md) rule 4). Tool: [fast-check](#fast-check). **Card:** [Vitest](tech/vitest.md) · **Level:** advanced  
**Learn:** <https://fast-check.dev/docs/introduction/>

<a id="pull-request"></a>

### Pull request (PR)

**Plain words:** A request to merge a branch into `main`, with a page for review, checks and discussion.  
**In Tafsila:** Template in `.github/pull_request_template.md`; must contain `Closes #N`. **Level:** beginner  
**Learn:** <https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests>

<a id="function-purity"></a>

### Pure function

**Plain words:** A function whose result depends only on its inputs and which changes nothing outside itself.  
**In Tafsila:** Required for all engine code. See [functional core](patterns/functional-core-plugin-pipeline.md). **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Pure_function>

<a id="letter-r"></a>

## R

<a id="release"></a>

### Release

**Plain words:** The identifier of one deployed version, so an error can be traced to the code that produced it.  
**In Tafsila:** The git SHA, sent to Sentry as `release` (from `loadPublicConfig`). **Card:** [Sentry and PostHog](tech/sentry-posthog.md) · **Level:** beginner  
**Learn:** <https://docs.sentry.io/product/releases/>

<a id="request-id"></a>

### Request id

**Plain words:** A short unique code given to every request so one failure can be followed through logs and error reports.  
**In Tafsila:** The `x-request-id` header, the `request_id` field of the error body and the Sentry tag. See [find a bug from a report](find-a-bug-from-a-report.md). **Card:** [Sentry and PostHog](tech/sentry-posthog.md) · **Level:** beginner  
**Learn:** <https://docs.sentry.io/platforms/javascript/enriching-events/tags/>

<a id="rate-limiting"></a>

### Rate limiting

**Plain words:** Refusing a caller who sends too many requests too fast.  
**In Tafsila:** Planned on auth, AI and checkout endpoints ([SRS NFR-04](../SRS.md)). **Level:** intermediate  
**Learn:** <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429>

<a id="react"></a>

### React

**Plain words:** A JavaScript library for building screens from components.  
**In Tafsila:** Used by `apps/web` and `packages/ui` (React 19). **Card:** [React](tech/react.md) · **Level:** beginner  
**Learn:** <https://react.dev/learn>

<a id="react-hook-form"></a>

### React Hook Form

**Plain words:** A library for building forms with validation in React.  
**In Tafsila:** Planned together with Zod schemas ([SRS section 3.1](../SRS.md)). **Card:** [Zod](tech/zod.md) · **Level:** intermediate  
**Learn:** <https://react-hook-form.com/get-started>

<a id="repository"></a>

### Repository secret

**Plain words:** A value stored once in GitHub (Settings, Secrets and variables, Actions) that workflows read but nobody can see again.  
**In Tafsila:** Staging names end in `_STAGING`; they reach steps only through `env:` ([switch environment](../backend/tutorials/switch-environment.md), [ADR-023](../DECISIONS.md)). **Card:** [Vercel](tech/vercel.md) · **Level:** beginner  
**Learn:** <https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions>

### Repository (pattern)

**Plain words:** A port that hides how data is stored, so services ask for "this design" without knowing about SQL.  
**In Tafsila:** `DesignRepository`, `ClientRepository` (planned). Do not confuse with the Git repository ("repo"). **Card:** [Supabase](tech/supabase.md) · **Level:** intermediate  
**Learn:** <https://martinfowler.com/eaaCatalog/repository.html>

<a id="rest"></a>

### REST

**Plain words:** A common style for HTTP APIs: addresses name things (`/designs/5`) and methods say what to do (GET, POST, PUT, PATCH, DELETE).  
**In Tafsila:** Our API follows it ([SRS section 8](../SRS.md)). **Card:** [Hono](tech/hono.md) · **Level:** beginner  
**Learn:** <https://developer.mozilla.org/en-US/docs/Glossary/REST>

<a id="rls"></a>

### RLS (Row Level Security)

**Plain words:** A Postgres rule that decides which rows each user may read or write, enforced by the database itself.  
**In Tafsila:** Every user-owned table has RLS; see `supabase/migrations/` (planned, M1) and `.claude/rules/backend/database.md`. **Card:** [Supabase](tech/supabase.md) · **Level:** intermediate  
**Learn:** <https://supabase.com/docs/guides/database/postgres/row-level-security>

<a id="route"></a>

### Route

**Plain words:** The mapping from an address (and method) to the code that answers it.  
**In Tafsila:** API routes: `packages/api/src/routes/`; pages: `apps/web/src/app/`. **Card:** [Hono](tech/hono.md) · **Level:** beginner  
**Learn:** <https://hono.dev/docs/api/routing>

<a id="route-handler"></a>

### Route handler

**Plain words:** A function Next.js runs for a given URL and method.  
**In Tafsila:** `apps/web/src/app/api/[[...route]]/route.ts` forwards all `/api/*` calls to Hono. **Card:** [Next.js](tech/nextjs.md) · **Level:** intermediate  
**Learn:** <https://nextjs.org/docs/app/getting-started/route-handlers>

<a id="rtl"></a>

### RTL (right-to-left)

**Plain words:** Text and layout direction used by Arabic: reading starts on the right.  
**In Tafsila:** Arabic is the default; layouts use [logical CSS](#css-logical) ([frontend docs](../frontend/README.md)). **Card:** [next-intl](tech/next-intl.md) · **Level:** beginner  
**Learn:** <https://developer.mozilla.org/en-US/docs/Glossary/RTL>

<a id="runtime"></a>

### Runtime

**Plain words:** The environment that executes the code (Node.js on the server, the browser on the client).  
**In Tafsila:** Env vars are read at runtime, so one image runs everywhere ([ADR-004](../DECISIONS.md)). **Level:** beginner  
**Learn:** <https://nodejs.org/en/learn/getting-started/introduction-to-nodejs>

<a id="letter-s"></a>

## S

<a id="source-map"></a>

### Source map

**Plain words:** A file that maps minified production code back to the original lines, so an error stack is readable.  
**In Tafsila:** Uploaded to Sentry by the staging CI build only, then deleted from the build output (ADR-025). **Card:** [Sentry and PostHog](tech/sentry-posthog.md) · **Level:** intermediate  
**Learn:** <https://docs.sentry.io/platforms/javascript/sourcemaps/>

<a id="sbom"></a>

### SBOM (software bill of materials)

**Plain words:** A list of every component inside a piece of software, used to spot known vulnerabilities.  
**In Tafsila:** Attached to container images by the Docker workflow (attestations). **Card:** [Docker](tech/docker.md) · **Level:** advanced  
**Learn:** <https://www.cisa.gov/sbom>

<a id="schema"></a>

### Schema

**Plain words:** A description of the shape valid data must have.  
**In Tafsila:** Zod schemas in `packages/schemas`. See [schema-first contracts](patterns/schema-first-contracts.md). **Card:** [Zod](tech/zod.md) · **Level:** beginner  
**Learn:** <https://zod.dev/>

<a id="seam-allowance"></a>

### Seam allowance (SA)

**Plain words:** The margin between the stitching line and the cutting line. Arabic: حرف الخياطة.  
**In Tafsila:** Defaults: 15 mm sides, 10 mm necklines and armholes, 30 mm hems (FR-PAT-03). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Seam_allowance>

<a id="seed"></a>

### Seed data

**Plain words:** Fake records loaded into non-production databases so you can try the app.  
**In Tafsila:** `supabase/seed.sql`, documented in `docs/backend/seed-data.md`; never in production. **Card:** [Supabase](tech/supabase.md) · **Level:** beginner  
**Learn:** <https://supabase.com/docs/guides/local-development/seeding-your-database>

<a id="selvedge"></a>

### Selvedge

**Plain words:** The finished edge along the length of a fabric roll that does not fray. The grain runs parallel to it. Arabic: خط البرسل.  
**In Tafsila:** Used as a reference line in direct-to-fabric steps (FR-CUT-01). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Selvage>

<a id="semver"></a>

### Semantic version (semver)

**Plain words:** A version number MAJOR.MINOR.PATCH that tells how big a change is.  
**In Tafsila:** `ENGINE_VERSION` is `0.1.0`. **Level:** beginner  
**Learn:** <https://semver.org/>

<a id="sentry"></a>

### Sentry

**Plain words:** A service that collects crash reports from the app.  
**In Tafsila:** Planned ([SRS NFR-09](../SRS.md)). **Card:** [Sentry](tech/sentry-posthog.md) · **Level:** intermediate  
**Learn:** <https://docs.sentry.io/>

<a id="server-component"></a>

### Server Component

**Plain words:** A React component that runs only on the server and sends HTML to the browser.  
**In Tafsila:** Pages and data loading ([ARCHITECTURE section 1](../ARCHITECTURE.md)); `page.tsx` today. **Card:** [Next.js](tech/nextjs.md) · **Level:** intermediate  
**Learn:** <https://nextjs.org/docs/app/getting-started/server-and-client-components>

<a id="service"></a>

### Service (use case)

**Plain words:** One business action in code, such as "create a pattern version", that uses ports and domain rules.  
**In Tafsila:** `packages/api/src/services/` (planned), one use case per file. Not the same as a deployed service such as `services/sim`. **Level:** intermediate  
**Learn:** <https://alistair.cockburn.us/hexagonal-architecture/>

<a id="set-in-sleeve"></a>

### Set-in sleeve (and puff, bishop, flutter, cap)

**Plain words:** A set-in sleeve is sewn into the armhole at the shoulder. Variants: puff (gathered at the top), bishop (full, gathered at the cuff), flutter (a loose frill), cap (very short, covering only the shoulder).  
**In Tafsila:** `sleeve.type` values `none`, `set-in`, `cap`, `puff`, `bishop`, `flutter`; `sleeve.length` values `cap`, `short`, `elbow`, `three-quarter`, `long`. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Sleeve>

<a id="sew-test"></a>

### Sew test (needs:sew-test, toile)

**Plain words:** Physically sewing a garment (a toile, a cheap test version) to confirm the pattern really fits. Arabic: تجربة (توال).  
**In Tafsila:** Each garment type is sewn in at least 3 sizes before release; the label `needs:sew-test` keeps the issue open until done ([engine docs](../engine/README.md)). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Toile>

<a id="sewing-order"></a>

### Sewing order

**Plain words:** The ordered list of assembly steps (sew, press, finish, attach) that refer to piece edges.  
**In Tafsila:** Pipeline step 7 (`sewingOrder`); FR-PAT-06. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Sewing_pattern>

<a id="shadcn"></a>

### shadcn/ui

**Plain words:** A set of copy-in React components built on Tailwind that a project owns and edits.  
**In Tafsila:** Base of `packages/ui` ([frontend docs](../frontend/README.md)). **Card:** [shadcn/ui](tech/shadcn-ui.md) · **Level:** intermediate  
**Learn:** <https://ui.shadcn.com/docs>

<a id="signed-url"></a>

### Signed URL

**Plain words:** A temporary web address that grants access to one private file for a short time.  
**In Tafsila:** Used for photos and exports in private storage ([SRS NFR-04, NFR-05](../SRS.md)). **Card:** [Supabase](tech/supabase.md) · **Level:** intermediate  
**Learn:** <https://supabase.com/docs/guides/storage/serving/downloads>

<a id="sim"></a>

### Sim service (services/sim)

**Plain words:** A separate Python service for a later release that simulates how cloth hangs.  
**In Tafsila:** Only a template Dockerfile exists; it talks to the API through a `JobQueue` port ([ARCHITECTURE section 4](../ARCHITECTURE.md)). **Card:** [Python, FastAPI and GarmentCode](tech/python-fastapi-garmentcode.md) · **Level:** advanced  
**Learn:** <https://fastapi.tiangolo.com/>

<a id="sessionstart-hook"></a>

### SessionStart hook

**Plain words:** A command Claude Code runs automatically when a session starts, configured in `.claude/settings.json`.  
**In Tafsila:** Runs `scripts/agent-setup.sh`, which exits at once unless `CLAUDE_CODE_REMOTE=true` (a cloud session) or `GITHUB_ACTIONS=true`, so it never runs on a laptop; in the cloud (and in GitHub Actions) it enables corepack and runs `pnpm install --frozen-lockfile`, writing everything to a log file and printing one summary line (ADR-016, ADR-017). **Card:** [Claude Code](tech/claude-code.md) · **Level:** intermediate  
**Learn:** <https://docs.claude.com/en/docs/claude-code/hooks>

<a id="skill-agent"></a>

### Skill (Claude Code)

**Plain words:** A saved step-by-step recipe an agent follows for a common task.  
**In Tafsila:** `.claude/skills/` (`add-page`, `add-endpoint`, `add-garment-module`) (ADR-008). **Level:** intermediate  
**Learn:** <https://docs.claude.com/en/docs/claude-code/skills>

<a id="skirt-types"></a>

### Skirt types (a-line, circle, gathered, pleated, tiered)

**Plain words:** A-line widens gently to the hem. Half or full circle is cut from a circle of fabric for lots of swing. Gathered is a rectangle drawn in at the top. Pleated has folds. Tiered has stacked, wider layers.  
**In Tafsila:** `skirt.type` values `straight`, `a-line`, `circle-half`, `circle-full`, `gathered`, `pleated`, `tiered`; lengths `mini` to `floor`; optional `slit`. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Skirt>

<a id="slash-command"></a>

### Slash command

**Plain words:** A saved prompt you run by typing `/name`.  
**In Tafsila:** `.claude/commands/` (`/triage`, `/plan`, `/plan-milestone`, `/plan-wave`, `/build`, `/review`, `/ship`, `/status`, `/release-check`). **Level:** beginner  
**Learn:** <https://docs.claude.com/en/docs/claude-code/slash-commands>

<a id="sleeve-cap"></a>

### Sleeve cap (cap height, cap ease)

**Plain words:** The curved top of a sleeve that fits into the armhole. Cap ease is how much longer the cap seam is than the armhole, so the fabric can be gently eased in. Arabic: دوران الكم.  
**In Tafsila:** `packages/engine/src/sleeve/sleeve-cap.ts`; FR-VAL-02 requires 10 to 40 mm for woven set-in sleeves. **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Sleeve>

<a id="snapshot-test"></a>

### Snapshot test

**Plain words:** A test that saves the output once and fails later if the output changes, so you notice unintended changes.  
**In Tafsila:** Planned: an SVG snapshot per size of each pattern ([SRS section 11](../SRS.md)). **Card:** [Vitest](tech/vitest.md) · **Level:** intermediate  
**Learn:** <https://vitest.dev/guide/snapshot>

<a id="sql"></a>

### SQL

**Plain words:** The language used to ask a relational database for data.  
**In Tafsila:** Only repositories in `adapters/supabase` write queries ([ARCHITECTURE section 5](../ARCHITECTURE.md)). **Card:** [Supabase](tech/supabase.md) · **Level:** beginner  
**Learn:** <https://www.postgresql.org/docs/current/tutorial-sql.html>

<a id="srs"></a>

### SRS (Software Requirements Specification)

**Plain words:** The document that lists everything the software must do, with an ID per requirement (FR-PAT-03, NFR-01...).  
**In Tafsila:** [docs/SRS.md](../SRS.md). `FR-` is functional, `NFR-` is non-functional (quality). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Software_requirements_specification>

<a id="status-label"></a>

### Status label (`status:*`)

**Plain words:** The GitHub label that shows where an issue is in the workflow (ready, in-progress, in-review...). Exactly one at a time.  
**In Tafsila:** [WORKFLOW section 3](../WORKFLOW.md); synced from PRs by `.github/workflows/status-labels.yml`. **Level:** beginner  
**Learn:** <https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels>

<a id="cut-path"></a>

### Stitch path and cut path

**Plain words:** The stitch path is the sewing line; the cut path is the same outline moved outwards by the seam allowance, where you cut.  
**In Tafsila:** Both are on every `Piece` as closed paths in millimetres ([SRS section 6.3](../SRS.md)). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Sewing_pattern>

<a id="storage"></a>

### Storage (Supabase Storage)

**Plain words:** Private file storage for photos and exported PDFs.  
**In Tafsila:** Accessed through a `FileStorage` port and signed URLs (planned). **Card:** [Supabase](tech/supabase.md) · **Level:** beginner  
**Learn:** <https://supabase.com/docs/guides/storage>

<a id="straight-grain"></a>

### Straight grain and cross grain

**Plain words:** Woven fabric has threads running lengthwise (straight grain, parallel to the selvedge) and crosswise (cross grain). Pieces are cut along the straight grain so they hang straight.  
**In Tafsila:** Projector mode limits rotation to 0 and 180 degrees to respect the grain (FR-PROJ-04). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Warp_and_weft>

<a id="structured-output"></a>

### Structured output

**Plain words:** Forcing an AI model to answer in a fixed shape (JSON that matches a schema) instead of free text.  
**In Tafsila:** The AI must fill a `DesignSpec`; invalid output is retried once ([SRS section 9](../SRS.md)). **Card:** [Zod](tech/zod.md) · **Level:** intermediate  
**Learn:** <https://ai-sdk.dev/docs>

<a id="subagent"></a>

### Subagent

**Plain words:** A helper agent the main agent starts for one small job; it works in its own context and returns only a short answer, so the main session stays small.  
**In Tafsila:** `.claude/agents/code-search.md` (finds where something lives) and `.claude/agents/test-runner.md` (runs tests, reports only failures), both on the cheap haiku model (ADR-017). **Card:** [Claude Code](tech/claude-code.md) · **Level:** intermediate  
**Learn:** <https://docs.claude.com/en/docs/claude-code/sub-agents>

<a id="supabase"></a>

### Supabase db push

**Plain words:** The command that applies the new migration files to a remote Supabase database, in order, once each.  
**In Tafsila:** Run only by `.github/workflows/staging.yml` on merge to `main`, never by hand and never with the seed ([ADR-023](../DECISIONS.md)). **Card:** [Supabase](tech/supabase.md) · **Level:** intermediate  
**Learn:** <https://supabase.com/docs/reference/cli/supabase-db-push>

### Supabase

**Plain words:** A hosted platform around Postgres that adds login (Auth) and file storage (Storage).  
**In Tafsila:** Planned for M1 ([ADR-003](../DECISIONS.md)); started locally with `supabase start`. **Card:** [Supabase](tech/supabase.md) · **Level:** intermediate  
**Learn:** <https://supabase.com/docs>

<a id="svg"></a>

### SVG

**Plain words:** A text format for drawings made of lines and curves that stay sharp at any zoom.  
**In Tafsila:** How the viewer and projector draw patterns; snapshots compare SVG text ([SRS NFR-08](../SRS.md)). **Level:** beginner  
**Learn:** <https://developer.mozilla.org/en-US/docs/Web/SVG>

<a id="letter-t"></a>

## T

<a id="tailwind"></a>

### Tailwind CSS

**Plain words:** A styling approach that composes small utility classes (`px-5 rounded-lg`) in the markup.  
**In Tafsila:** `packages/ui/src/button.tsx`; `@tailwindcss/postcss` in `apps/web`. **Card:** [Tailwind CSS](tech/tailwind.md) · **Level:** beginner  
**Learn:** <https://tailwindcss.com/docs>

<a id="query-client"></a>

### TanStack Query

**Plain words:** A library that fetches server data, caches it and keeps screens up to date.  
**In Tafsila:** Planned for all server data in the web app ([ARCHITECTURE section 1](../ARCHITECTURE.md)). **Card:** [TanStack Query](tech/tanstack-query.md) · **Level:** intermediate  
**Learn:** <https://tanstack.com/query/latest/docs/framework/react/overview>

<a id="tech-card"></a>

### Tech card

**Plain words:** A one-page note about one technology: what it is, why we chose it, what we rejected and when we would change our mind.  
**In Tafsila:** One per technology in `docs/handbook/tech/`; the index is [tech/README.md](tech/README.md). Every direct dependency must be covered by a card's `packages:` list. **Level:** beginner

<a id="three-js"></a>

### Three.js and React Three Fiber

**Plain words:** Libraries for drawing 3D scenes in the browser.  
**In Tafsila:** Planned for the 3D assembly preview, now post-launch ([ADR-009](../DECISIONS.md)). **Level:** advanced  
**Learn:** <https://threejs.org/docs/>

<a id="transpile"></a>

### Transpile

**Plain words:** Converting code from one form to another that the runtime understands (TypeScript to JavaScript).  
**In Tafsila:** `transpilePackages` in `apps/web/next.config.ts` compiles the internal packages from source. **Card:** [Next.js](tech/nextjs.md) · **Level:** intermediate  
**Learn:** <https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages>

<a id="triage"></a>

### Triage

**Plain words:** Sorting a raw idea into a ready issue: labels, size, model, requirement IDs, acceptance criteria.  
**In Tafsila:** The `/triage` command ([WORKFLOW section 1](../WORKFLOW.md)). **Level:** beginner  
**Learn:** <https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues>

<a id="trivy"></a>

### Trivy

**Plain words:** A scanner that looks for known security problems in container images.  
**In Tafsila:** Runs in the Docker workflow ([WORKFLOW section 5](../WORKFLOW.md)). **Card:** [Docker](tech/docker.md) · **Level:** advanced  
**Learn:** <https://trivy.dev/latest/docs/>

<a id="turborepo"></a>

### Turborepo

**Plain words:** A tool that runs tasks across all packages of a monorepo and caches the results.  
**In Tafsila:** `turbo.json`; `pnpm test`, `pnpm build` and `pnpm typecheck` call it. **Card:** [Turborepo](tech/turborepo.md) · **Level:** intermediate  
**Learn:** <https://turborepo.com/docs>

<a id="turn"></a>

### Turn

**Plain words:** One round in an agent run: the model answers, possibly calling a tool, and gets the result back. Every turn re-sends the conversation, so more turns means more tokens.  
**In Tafsila:** `--max-turns 50` caps cloud runs ([ADR-017](../DECISIONS.md)); `num_turns` is recorded per run and the weekly report flags runs above 60. **Card:** [Claude Code](tech/claude-code.md#measuring-agent-usage) · **Level:** beginner  
**Learn:** <https://docs.claude.com/en/docs/claude-code/costs>

<a id="type"></a>

### Type

**Plain words:** A label that says what kind of value something is (number, text, `DesignSpec`).  
**In Tafsila:** Types are inferred from schemas with `z.infer`. **Card:** [TypeScript](tech/typescript.md) · **Level:** beginner  
**Learn:** <https://www.typescriptlang.org/docs/handbook/2/everyday-types.html>

<a id="typecheck"></a>

### Type checking (tsc)

**Plain words:** Running the TypeScript compiler without producing files, only to find type errors.  
**In Tafsila:** `pnpm typecheck`. **Card:** [TypeScript](tech/typescript.md) · **Level:** beginner  
**Learn:** <https://www.typescriptlang.org/docs/handbook/2/basic-types.html>

<a id="typescript"></a>

### TypeScript

**Plain words:** JavaScript with types, so many mistakes are caught before running.  
**In Tafsila:** Strict mode everywhere ([ADR-001](../DECISIONS.md)); `any` is forbidden. **Card:** [TypeScript](tech/typescript.md) · **Level:** beginner  
**Learn:** <https://www.typescriptlang.org/docs/>

<a id="letter-u"></a>

## U

<a id="use-case"></a>

### Use case

**Plain words:** See [service](#service).  
**In Tafsila:** **Level:** intermediate  
**Learn:** <https://alistair.cockburn.us/hexagonal-architecture/>

<a id="uv"></a>

### uv

**Plain words:** A fast Python package and version manager.  
**In Tafsila:** Isolates `services/sim` with the version in `.python-version`. **Card:** [Python, FastAPI and GarmentCode](tech/python-fastapi-garmentcode.md) · **Level:** intermediate  
**Learn:** <https://docs.astral.sh/uv/>

<a id="letter-v"></a>

## V

<a id="validation-report"></a>

### ValidationReport (FR-VAL)

**Plain words:** The engine's own quality check: pass, warn or fail for each rule, with measured and expected values and a plain-language message in Arabic and English.  
**In Tafsila:** Rules FR-VAL-01 to FR-VAL-09 ([engine docs](../engine/README.md)); the UI highlights the affected edge. **Level:** intermediate  
**Learn:** <https://en.wikipedia.org/wiki/Software_verification_and_validation>

<a id="vercel"></a>

### Vercel

**Plain words:** The hosting company that runs the Next.js app and builds previews.  
**In Tafsila:** Primary host ([ADR-003](../DECISIONS.md)); a Docker image is the exit plan ([ADR-004](../DECISIONS.md)). **Card:** [Vercel](tech/vercel.md) · **Level:** beginner  
**Learn:** <https://vercel.com/docs>

<a id="sdk"></a>

### Vercel AI SDK

**Plain words:** A TypeScript library for calling AI models with one interface and structured (schema-checked) output.  
**In Tafsila:** Planned for `packages/ai` ([SRS section 3.1](../SRS.md)). **Level:** intermediate  
**Learn:** <https://ai-sdk.dev/docs>

<a id="vitest"></a>

### Vitest

**Plain words:** A fast test runner for TypeScript.  
**In Tafsila:** `pnpm test`; test files sit next to the code. **Card:** [Vitest](tech/vitest.md) · **Level:** beginner  
**Learn:** <https://vitest.dev/guide/>

<a id="letter-w"></a>

## W

<a id="waistband"></a>

### Waistband

**Plain words:** A strip sewn at the waist: straight, contour (shaped to the body) or elastic.  
**In Tafsila:** `DesignSpec.waistband` values `none`, `straight`, `contour`, `elastic`. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Waistband>

<a id="wcag"></a>

### WCAG

**Plain words:** Web Content Accessibility Guidelines: rules so people with disabilities can use the web.  
**In Tafsila:** Target level AA for core flows ([SRS NFR-07](../SRS.md)). **Level:** intermediate  
**Learn:** <https://www.w3.org/WAI/standards-guidelines/wcag/>

<a id="web-worker"></a>

### Web Worker

**Plain words:** A background thread in the browser, so heavy work does not freeze the page.  
**In Tafsila:** Planned for fabric nesting and PDF tiling ([ARCHITECTURE section 1](../ARCHITECTURE.md)). **Level:** advanced  
**Learn:** <https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers>

<a id="webhook"></a>

### Webhook

**Plain words:** A message another service sends to our server when something happens (for example a payment succeeded).  
**In Tafsila:** Paymob payment webhooks (planned), verified with [HMAC](#hmac) and handled [idempotently](#idempotency). **Card:** [Paymob](tech/paymob-fawry.md) · **Level:** intermediate  
**Learn:** <https://docs.github.com/en/webhooks/about-webhooks>

<a id="workspace"></a>

### Workspace

**Plain words:** A package inside a monorepo that pnpm links to the others.  
**In Tafsila:** `apps/*` and `packages/*` in `pnpm-workspace.yaml`; dependencies like `"@tafsila/ui": "workspace:*"`. **Card:** [pnpm](tech/pnpm.md) · **Level:** beginner  
**Learn:** <https://pnpm.io/workspaces>

<a id="woven-knit"></a>

### Woven vs knit fabric

**Plain words:** Woven fabric is made of threads crossing at right angles and barely stretches. Knit fabric is made of loops and stretches. They need different patterns and ease.  
**In Tafsila:** v1 supports **woven only** (`fabricType: "woven"`); knits and stretch fabrics come later ([SRS section 1.2](../SRS.md)). **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Textile>

<a id="letter-y"></a>

## Y

<a id="yardage"></a>

### Yardage

**Plain words:** How much fabric you need to buy for a garment, taking fabric width and layout into account.  
**In Tafsila:** Computed by nesting (FR-FAB) at the chosen fabric width. **Level:** beginner  
**Learn:** <https://en.wikipedia.org/wiki/Yardage>

<a id="letter-z"></a>

## Z

<a id="zod"></a>

### Zod

**Plain words:** A TypeScript library to define a schema once and get runtime validation plus a type from it.  
**In Tafsila:** `packages/schemas`, `packages/config`. See [schema-first contracts](patterns/schema-first-contracts.md). **Card:** [Zod](tech/zod.md) · **Level:** beginner  
**Learn:** <https://zod.dev/>

<a id="zustand"></a>

### Zustand

**Plain words:** A small library for sharing state between React components.  
**In Tafsila:** Planned only for the pattern editor session (selected piece, zoom, layers). **Card:** [Zustand](tech/zustand.md) · **Level:** intermediate  
**Learn:** <https://zustand.docs.pmnd.rs/>
