#!/usr/bin/env bash
# Acceptance-criteria checklist helper for GitHub issues.
# Reads the "## Acceptance criteria" section of an issue and ticks items when they are met.
#
# Usage:
#   scripts/gh-ac.sh list     <issue>            # numbered criteria with ✔ / ☐
#   scripts/gh-ac.sh check    <issue> <n> [n…]   # tick criteria by number
#   scripts/gh-ac.sh uncheck  <issue> <n> [n…]   # untick (if a criterion regressed)
#   scripts/gh-ac.sh progress <issue>            # e.g. "5/7 acceptance criteria met"
set -euo pipefail

cmd="${1:-}"; issue="${2:-}"
[ -n "$cmd" ] && [ -n "$issue" ] || { sed -n '2,9p' "$0"; exit 1; }
shift 2 || true

body="$(gh issue view "$issue" --json body --jq '.body')"

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
    set_marks "$mark" "$@" | gh issue edit "$issue" --body-file - >/dev/null
    body="$(gh issue view "$issue" --json body --jq '.body')"
    "$0" list "$issue"; "$0" progress "$issue" ;;
  *) sed -n '2,9p' "$0"; exit 1 ;;
esac
