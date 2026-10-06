#!/usr/bin/env bash
# Creates or updates all labels from .github/labels.yml on the current GitHub repo.
# Requires: gh (authenticated: `gh auth login`) and python3.
# Usage: scripts/setup-labels.sh            # current repo
#        scripts/setup-labels.sh owner/repo
set -euo pipefail
REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
FILE="$(dirname "$0")/../.github/labels.yml"

python3 - "$FILE" <<'PY' | while IFS=$'\t' read -r name color desc; do
import re, sys
for line in open(sys.argv[1], encoding="utf-8"):
    m = re.match(r'\s*-\s*\{\s*name:\s*"([^"]+)",\s*color:\s*"([0-9a-fA-F]{6})",\s*description:\s*"([^"]*)"', line)
    if m: print("\t".join(m.groups()))
PY
  if gh label create "$name" --repo "$REPO" --color "$color" --description "$desc" 2>/dev/null; then
    echo "created  $name"
  else
    gh label edit "$name" --repo "$REPO" --color "$color" --description "$desc" >/dev/null
    echo "updated  $name"
  fi
done
echo "Labels synced on $REPO"
