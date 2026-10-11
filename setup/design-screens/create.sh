#!/bin/bash
# Creates the "design files into the repo" issue and adds it to the board.
# needs:interactive because the source files live only in Merna's local setup/ folder,
# so a cloud run could not see them: build it with /build in Claude Code on the Mac.
set -e
cd "$(dirname "$0")"
URL=$(gh issue create \
  --repo merna550/tafsila \
  --title "Design: add M1 screen designs and bilingual copy rules to the repo" \
  --body-file issue.md \
  --label "status:ready" --label "plan:none" --label "build:sonnet" \
  --label "size:S" --label "type:docs" --label "priority:P1" \
  --label "area:docs" --label "area:ui" --label "needs:interactive")
echo "Created: $URL"
gh project item-add 4 --owner merna550 --url "$URL" && echo "Added to board"
