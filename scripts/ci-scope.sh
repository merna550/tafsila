#!/usr/bin/env bash
# Decides what the Code quality workflow checks (issues #17, #188). Prints GitHub Actions outputs:
#   filter=<turbo filter>   "--filter=...[<ref>]" when the change is known, empty (= every package) otherwise
#   lint_files=<value>      "all", or a file listing the changed source files, or empty when none changed
#   format_files=<value>    "all", or a file listing every changed file for `prettier --check`, or empty when none
# The change is the pull request (base...HEAD) or a push to main (before..sha, the same diff the path filters in
# scripts/ci-paths.mjs use). The nightly run, a manual run, a first push or a git error check everything, and so
# does a change to root config (lockfile, tsconfig, ESLint or Prettier config, Node version).
# Usage: scripts/ci-scope.sh <event_name> <base_ref> [<before_sha> <sha>]
set -euo pipefail
event="${1:-}"
base_ref="${2:-}"
before="${3:-}"
sha="${4:-HEAD}"
ROOT_CONFIG='^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|turbo\.json|tsconfig(\.base)?\.json|eslint\.config\.mjs|\.prettierrc\.json|\.prettierignore|\.editorconfig|\.nvmrc)$'

everything() {
  echo "filter="
  echo "lint_files=all"
  echo "format_files=all"
  exit 0
}

if [ "$event" = "pull_request" ] && [ -n "$base_ref" ]; then
  ref="origin/$base_ref"
  range="$ref...HEAD"
elif [ "$event" = "push" ] && [[ "$before" =~ ^[0-9a-f]{40}$ ]] && [[ ! "$before" =~ ^0+$ ]]; then
  ref="$before"
  range="$before..$sha"
else
  everything
fi

changed="$(git diff --name-only --diff-filter=ACMR "$range" 2>/dev/null)" || everything
if printf '%s\n' "$changed" | grep -qE "$ROOT_CONFIG"; then everything; fi

dir="${RUNNER_TEMP:-${TMPDIR:-/tmp}}"
lint_list="$dir/lint-files.txt"
format_list="$dir/format-files.txt"
printf '%s\n' "$changed" | grep -E '\.(ts|tsx|mjs|cjs)$' >"$lint_list" || true
printf '%s\n' "$changed" | grep -v '^$' >"$format_list" || true
echo "filter=--filter=...[$ref]"
if [ -s "$lint_list" ]; then echo "lint_files=$lint_list"; else echo "lint_files="; fi
if [ -s "$format_list" ]; then echo "format_files=$format_list"; else echo "format_files="; fi
