#!/usr/bin/env bash
# PostToolUse hook (issue #17): formats and lint-fixes only the file the agent just edited or wrote.
# Silent when the file ends up clean. Otherwise prints at most 30 lines of the remaining errors to stderr
# and exits 2, which Claude Code shows to the agent, so it never spends a turn on formatting.
set -uo pipefail
MAX_LINES=30

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
root="$(pwd -P)"
file="$(node "$root/scripts/hooks/read-hook-input.mjs" tool_input.file_path)"

[ -n "$file" ] && [ -f "$file" ] || exit 0
[ -x node_modules/.bin/prettier ] || exit 0 # dependencies not installed yet
case "$(cd "$(dirname "$file")" && pwd -P)/" in
  "$root"/node_modules/* | "$root"/*/node_modules/*) exit 0 ;;
  "$root"/*) ;;
  *) exit 0 ;; # outside the repo (scratchpad, /tmp)
esac

report() {
  printf '%s\n' "$1" | grep -v '^[[:space:]]*$' | head -n "$MAX_LINES" >&2
  exit 2
}

out="$(node_modules/.bin/prettier --write --ignore-unknown --log-level warn "$file" 2>&1)" || report "prettier: $out"

case "$file" in
  *.ts | *.tsx | *.mjs | *.cjs | *.js)
    out="$(node_modules/.bin/eslint --fix --max-warnings 0 --no-warn-ignored "$file" 2>&1)" || report "$out"
    ;;
esac
exit 0
