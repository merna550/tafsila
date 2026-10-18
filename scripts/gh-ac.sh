#!/usr/bin/env bash
# Acceptance-criteria checklist helper for GitHub issues.
# Uses the REST API only, so it works where GraphQL is blocked (set TAFSILA_REPO to override owner/repo).
# Reads the "## Acceptance criteria" section of an issue and ticks items when they are met.
#
# Usage:
#   scripts/gh-ac.sh list     <issue>            # numbered criteria with ✔ / ☐
#   scripts/gh-ac.sh check    <issue> <n> [n…]   # tick criteria by number
#   scripts/gh-ac.sh uncheck  <issue> <n> [n…]   # untick (if a criterion regressed)
#   scripts/gh-ac.sh progress <issue>            # e.g. "5/7 acceptance criteria met"
set -euo pipefail

cmd="${1:-}"; issue="${2:-}"
[ -n "$cmd" ] && [ -n "$issue" ] || { sed -n '2,10p' "$0"; exit 1; }
shift 2 || true

# REST only: `gh issue view|edit` use GraphQL, which cloud agent sessions cannot call (HTTP 403, issue #183).
repo="${TAFSILA_REPO:-merna550/tafsila}"
fetch_body() { gh api "repos/$repo/issues/$issue" --jq '.body // ""'; }
body="$(fetch_body)"

# Prints "<index>\t<state>\t<text>" for each checkbox inside the Acceptance criteria section.
criteria() {
  printf '%s\n' "$body" | awk '
    /^##[[:space:]]+Acceptance criteria/ { inside=1; next }
    /^##[[:space:]]/ { inside=0 }
    inside && /^[[:space:]]*- \[[ xX]\]/ {
      n++; state = ($0 ~ /- \[[xX]\]/) ? "x" : " ";
      text=$0; sub(/^[[:space:]]*- \[[ xX]\][[:space:]]*/, "", text);
      printf "%d\t%s\t%s\n", n, state, text
    }'
}

# Rewrites the body with the given criteria set to the given mark ("x" or " ").
set_marks() {
  local mark="$1"; shift
  local wanted=" $* "
  printf '%s\n' "$body" | awk -v wanted="$wanted" -v mark="$mark" '
    /^##[[:space:]]+Acceptance criteria/ { inside=1; print; next }
    /^##[[:space:]]/ { inside=0 }
    inside && /^[[:space:]]*- \[[ xX]\]/ {
      n++
      if (index(wanted, " " n " ") > 0) { sub(/- \[[ xX]\]/, "- [" mark "]") }
    }
    { print }'
}

case "$cmd" in
  list)
    criteria | while IFS=$'\t' read -r n state text; do
      [ "$state" = "x" ] && icon="✔" || icon="☐"
      printf '%2s. %s %s\n' "$n" "$icon" "$text"
    done ;;
  progress)
    total="$(criteria | wc -l | tr -d ' ')"
    done_n="$(criteria | awk -F'\t' '$2=="x"' | wc -l | tr -d ' ')"
    echo "$done_n/$total acceptance criteria met" ;;
  check|uncheck)
    [ "$#" -gt 0 ] || { echo "✘ give the criterion numbers (see: $0 list $issue)" >&2; exit 1; }
    mark="x"; [ "$cmd" = "uncheck" ] && mark=" "
    set_marks "$mark" "$@" | gh api -X PATCH "repos/$repo/issues/$issue" -F "body=@-" >/dev/null
    body="$(fetch_body)"
    "$0" list "$issue"; "$0" progress "$issue" ;;
  *) sed -n '2,10p' "$0"; exit 1 ;;
esac
