# ADR-33a · 2026-10-14 · Code generators with `turbo gen`

**Context:** Every endpoint, web feature and engine module starts with the same files. Agents spent tokens re-reading an example and re-typing the boilerplate, and the results drifted (issue #33).
**Decision:**

1. **`turbo gen` (Plop) generators** in `turbo/generators/config.ts`, templates in `turbo/generators/templates/<generator>/*.hbs`. `pnpm gen <endpoint|feature|garment-module> <name> <issue>` (`scripts/gen.mjs`) is the only entry point; without arguments the generator asks.
2. **Templates are copies of the first real code**: `endpoint` from #29 (clients), `feature` from #30 (clients screens). `garment-module` has no real example yet (M2), so it is a small `FeatureModule` skeleton whose type is a placeholder until the M2 block-drafting contract (#122) replaces it.
3. **Output passes `pnpm quality` untouched**: the generator formats what it wrote with Prettier. The endpoint route takes its own small dependency type (not `Container`), so generated code compiles before it is wired. The endpoint adds the schema export to `packages/schemas/src/index.ts`; wiring the Container, `app.ts`, Supabase adapter, OpenAPI and Postman stays manual and is printed as "Next steps".
4. **Placeholder comments are `NEXT(#issue)`**, not `TODO`, because `sonarjs/todo-tag` fails the lint on `TODO`.
5. Names are kebab-case and singular; the route path adds an `s`.
6. The three skills (`add-endpoint`, `add-page`, `add-garment-module`), their tutorials and the context map say "run the generator first".
   **Reason:** Fewer tokens and the same shape everywhere, with no new runtime dependency (`@turbo/gen` is a dev dependency of the root).
   **Alternatives:** raw Plop (a second config to learn, no gain); copy-an-example in the skills (what we did, costs tokens and drifts); a generator that also edits `container.ts` and `app.ts` (fragile regex edits on shared files, which conflict between PRs, #76).
   **Reverse by:** deleting `turbo/` and the `gen` script.
