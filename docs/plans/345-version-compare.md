# Plan #345: Compare two pattern versions as an overlay

Copy of the approved plan comment on the issue (https://github.com/merna550/tafsila/issues/345#issuecomment-6566450193), summarised.

plan:sonnet, build:sonnet, size S, M6 wave 2, FR-CHAT-05, NFR-06, NFR-08, ADR-252, ADR-335 item 7. Screen: `docs/design/screens/Compare.dc.html`.

## Approach

Use the `add-page` skill. No API change: both versions are regenerated in the existing preview worker from their stored inputs.

- Entry: each history row gets a "compare" checkbox; two ticked enable "Compare", which links to `/designs/[id]/versions/compare?a&b`.
- Data: two `useVersion` reads and two preview runs. A different engine version on the two sides shows the `engineChanged` note.
- Overlay: pieces matched by `piece.id`, the first version solid and the second dashed, in the same coordinates (each piece at its own origin). A toggle shows A only, B only or both, a legend names the version numbers and dates, pan/zoom reuse the viewer. Pieces in one version only are listed and drawn in the success/danger roles.
- Differences (pure `model/diff-versions.ts`): spec feature by feature (labels from the design-picker messages), measurements and ease. No geometry numbers.
- Not found or another user's version: the shared error state. Same two versions: "choose two different versions".
- Messages `compare.*` ar/en; Merna reviews the Arabic.

## Test plan

Unit: `diff-versions`, `match-pieces`. Component: legend, overlay sides, difference list, notes. E2E: save two versions with a different sleeve length, tick both, compare, see the overlay and the "Sleeve length" difference; an unknown version shows the error state. Screenshots: ar/en, mobile and desktop.

## Deviations

- The "A only / B only / both" toggle is the two legend checkboxes (as in the design), not a separate `CompareToggle` component.
- Zoom is two buttons (zoom in, zoom out) over a scrollable SVG, not the viewer's gesture pan/zoom: the viewer draws one scene and cannot draw two line styles. Gesture pan/zoom can follow if needed.
- New files `CompareHeader`, `VersionPickers`, `OverlayPanel`, `describe-difference.ts`, `message-lookup.ts` and `pattern-page/model/compare-selection.ts` and `components/CompareBar.tsx` came from the lint limits on function length.
- A swap button and two version selectors (from the design) let the user change the pair on the compare screen.
- The "non-owner URL gives not-found" e2e uses ids that do not exist, because a second user needs a second sign-up; both give the same 404.
