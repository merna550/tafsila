# ADR-31b · 2026-10-13 · Measurement screens: guide art, start mode, groups (Part B)

**Context:** Part B of issue #31 builds the new and edit screens on top of the model and hooks from part A ([31a](31a-measurement-form.md)).

**Decision:**

1. Routes `/clients/[id]/measurements/new` and `/clients/[id]/measurements/[setId]`, both composed from `features/measurements` (`NewMeasurementSetScreen`, `EditMeasurementSetScreen`). A client or set that is not the user's, or a set of another client, shows the standard not-found page. After saving the app goes to the client's profile with a toast.
2. Guide texts live in `messages/{ar,en}.json` (`measurements.guide.<field>.steps|warning`, field names in `measurements.labels`), as planned. The placeholder art is data plus one component: `guide/guide-marks.json` says where each dashed line goes on one shared body outline and `GuideIllustration` draws it as inline SVG, instead of 18 separate `.svg` files. One drawing path means final art replaces one component; a test fails when a field has no mark or no text in either language. Merna reviews the Arabic texts.
3. The start mode ("from a standard size" / "custom") uses the existing `Tabs` from `packages/ui` (underline style) rather than a new segmented control; the design's pill look is a later polish. Switching to custom keeps the typed values and forgets the size label.
4. Groups after the first start folded to a summary row. Folding hides the boxes (`hidden`) instead of unmounting them, so typed values are kept; a group with an error or warning stays open.
5. Boxes that cannot be read ("required", "not a number") show their message only after the person touched the box, so a new custom form does not open covered in red. Save stays disabled with "fill in the required measurements" until every required box is valid.
6. A server rejection on save (`MEASUREMENTS_INVALID`) shows the standard toast. The form checks with the same engine, so it is rare; mapping the API's `details.issues` to boxes needs `ApiError` to carry them and is left out (no second source of truth for messages).
7. `useClient` is exported from the clients feature's `index.ts` for the page title and breadcrumb; the measurements feature does not fetch clients itself.
8. The size chart's name is printed under the size chips, so the "PLACEHOLDER (demo values)" chart is visible on staging until #32.

**Reason:** Keeps the screens thin, reuses what exists and keeps every text in the message files.

**Alternatives:** 18 SVG files (more files, same content); a new segmented control (more UI surface for little gain now); mapping server issues to boxes (needs an `ApiError` change).
