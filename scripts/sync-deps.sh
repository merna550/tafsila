#!/bin/sh
# Installs dependencies when pnpm-lock.yaml differs between two git revisions (issue #95).
# Called by the husky hooks post-merge, post-rewrite and post-checkout. Never fails the git operation.
# Usage: sh scripts/sync-deps.sh <old-rev> <new-rev>

old="${1:-}"
new="${2:-}"
[ "${CI:-}" = "true" ] && exit 0
[ -n "$old" ] && [ -n "$new" ] || exit 0

# git diff --quiet exits 1 when the file changed; any other non-zero code (bad revision) means "skip".
git diff --quiet "$old" "$new" -- pnpm-lock.yaml 2>/dev/null
[ $? -eq 1 ] || exit 0

echo "Dependencies changed, running pnpm install…"
pnpm install --frozen-lockfile || echo "pnpm install failed. Run it by hand: pnpm install" >&2
exit 0
