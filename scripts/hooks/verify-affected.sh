#!/usr/bin/env bash
# Stop hook (issue #17): before the agent says "done", typechecks and tests only the packages changed
# since origin/main (plus the packages that depend on them), and the repo scripts when they changed.
# On failure it prints a short summary (at most 30 lines) to stderr and exits 2, which makes the agent
# continue and fix it. If the agent already continued once because of this hook and it still fails,
# the stop is allowed with a warning for the person, so a problem the agent cannot fix never loops.
set -uo pipefail
MAX_LINES=30

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
again="$(node scripts/hooks/read-hook-input.mjs stop_hook_active)"

[ -x node_modules/.bin/turbo ] || exit 0 # dependencies not installed yet
base=""
for ref in origin/main main; do
  if git rev-parse --verify --quiet "$ref" >/dev/null; then base="$ref" && break; fi
done
[ -n "$base" ] || exit 0

# Nothing changed against main (committed, staged, unstaged or untracked): nothing to verify.
changed="$( (git diff --name-only "$base"; git ls-files --others --exclude-standard) | sort -u)"
[ -n "$changed" ] || exit 0

log="$(mktemp)"
trap 'rm -f "$log"' EXIT
status=0
node_modules/.bin/turbo run typecheck test --filter="...[$base]" --output-logs=errors-only >"$log" 2>&1 || status=1
if printf '%s\n' "$changed" | grep -q '^scripts/'; then
  node_modules/.bin/vitest run scripts >>"$log" 2>&1 || status=1
fi
[ "$status" -eq 0 ] && exit 0

summary="$(grep -E 'error|Error|FAIL|✗|×|failed' "$log" | grep -v '^[[:space:]]*$' | head -n $((MAX_LINES - 2)))"
if [ "$again" = "true" ]; then
  printf '{"systemMessage": "Affected typecheck/tests still fail on this branch. Run pnpm typecheck && pnpm test."}\n'
  exit 0
fi
{
  echo "Affected typecheck/tests failed (changed since $base). Fix before finishing:"
  printf '%s\n' "${summary:-$(tail -n $((MAX_LINES - 2)) "$log")}"
} >&2
exit 2
