#!/usr/bin/env bash
# Decides what the Code quality workflow checks (issue #17). Prints GitHub Actions outputs:
#   filter=<turbo filter>   "--filter=...[origin/<base>]" on pull requests, empty (= every package) otherwise
#   lint_files=<value>      "all", or a file listing the changed source files, or empty when none changed
# A pull request that changes root config (lockfile, tsconfig, ESLint config, Node version) checks everything.
# Usage: scripts/ci-scope.sh <event_name> <base_ref>
set -euo pipefail
event="${1:-}"
base_ref="${2:-}"
ROOT_CONFIG='^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|turbo\.json|tsconfig(\.base)?\.json|eslint\.config\.mjs|\.nvmrc)$'

if [ "$event" != "pull_request" ] || [ -z "$base_ref" ]; then
  echo "filter="
  echo "lint_files=all"
  exit 0
fi

base="origin/$base_ref"
changed="$(git diff --name-only --diff-filter=ACMR "$base"...HEAD)"
if printf '%s\n' "$changed" | grep -qE "$ROOT_CONFIG"; then
  echo "filter="
  echo "lint_files=all"
  exit 0
fi

list="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/lint-files.txt"
printf '%s\n' "$changed" | grep -E '\.(ts|tsx|mjs|cjs)$' >"$list" || true
echo "filter=--filter=...[$base]"
if [ -s "$list" ]; then echo "lint_files=$list"; else echo "lint_files="; fi
