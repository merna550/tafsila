#!/usr/bin/env bash
# Builds docs/test-cases/index.md: one row per test case across all feature files.
set -euo pipefail
cd "$(dirname "$0")/../docs/test-cases"
{
  echo "# Test case index (generated — do not edit)"; echo
  echo "| File | ID | Title | Priority | dev | staging |"; echo "|---|---|---|---|---|---|"
  find . -name '*.md' ! -name '_TEMPLATE.md' ! -name 'README.md' ! -name 'index.md' | sort | while read -r f; do
    { grep -E '^\| TC-' "$f" || true; } | awk -F'|' -v f="${f#./}" '{gsub(/^ +| +$/,"",$2);gsub(/^ +| +$/,"",$3);gsub(/^ +| +$/,"",$4);gsub(/^ +| +$/,"",$9);gsub(/^ +| +$/,"",$10);print "| " f " | " $2 " | " $3 " | " $4 " | " $9 " | " $10 " |"}'
  done
} > index.md
echo "wrote docs/test-cases/index.md"
