# Plan #318: Fabric calculator with marker diagram on the saved version

Approved plan comment: <https://github.com/merna550/tafsila/issues/318#issuecomment-6471628207>. Decisions: [ADR-318](../decisions/318-fabric-calculator.md).

Plan:sonnet, build:sonnet, size M, M5 wave 5. FR-FAB-01, FR-FAB-02, FR-FAB-03, FR-FAB-05, NFR-02, NFR-06.

1. Worker `apps/web/src/shared/fabric-nesting/` modelled on `shared/pattern-export`: protocol, pure handler (drafts again, `fabricResult`, `buildMarkerScene`), thin worker entry, client (latest wins, cancel restarts), hook. Bundle guard extended so `@tafsila/nesting` is only in the worker chunk.
2. Feature `features/fabric/`: `FabricCalculator` (options form, results per kind in metres with one decimal, does-not-fit notice with "try the open layout", marker diagram with zoom, progress with Cancel), hooks to read and save the calculation (`PUT`/`GET /api/versions/:id/fabric`), messages `fabric.calc.*` in ar/en.
3. Saved result shown on open without a run; recalculate is explicit; an older `nestingVersion` shows a note.
4. Tests: handler, client, state, model, components, bundle guard; e2e on CI; screenshots from a production build.

## Deviations

- Worker progress stages are `draft` and `nest` (not `prepare`, `main`, `lining`, `interfacing`): `fabricResult` does preparation and placement of all kinds in one call.
- The form is a controlled form over `fabricOptionsSchema`, not React Hook Form (ADR-318 item 6).
- The marker diagram is horizontal and zoom is buttons only, without the pan-zoom hook of the pattern viewer, which is tied to the pattern store (ADR-318 item 7).
- The saved result has no drawing: the diagram appears after "Recalculate" (ADR-318 item 2).
- The design's "show the layout with the projector" button is not built (out of scope in the issue).
- A new export `@tafsila/nesting/version` and the dependency-cruiser rule `nesting-only-in-nesting-worker`.
