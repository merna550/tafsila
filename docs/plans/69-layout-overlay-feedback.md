# Plan 69: layout, overlay and feedback components (foundations 2b/4)

The issue is the plan (`plan:none`). Part of #66; follows #68 (tokens, Storybook, form components).

## Order of work

1. Display and state parts: Card, Badge, Avatar, Skeleton, Spinner, Tooltip, EmptyState, ErrorState, PageHeader.
2. Overlays and structure: `ModalFrame` (shared), Dialog, Sheet, Tabs, Table, Toast system, AppShell.
3. Unit tests (static markup), RTL + LTR stories, visual snapshots, docs.

## Choices

- New Radix packages: avatar, dialog, tabs, toast, tooltip (listed on the Radix tech card). See ADR-032.
- Strings come in as props (already translated); stories use `sample-text.ts`.
- `IconButton` now sets `px-0!`: the base button's `px-5` won the CSS order and squeezed icons to 4px (found while checking the Dialog snapshot); its snapshots were regenerated.

## Out of scope

Connection banner, error boundary and `ApiError` routing (#72); `docs/frontend/design-system.md` and skills (#70).
