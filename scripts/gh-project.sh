#!/usr/bin/env bash
# Tafsila GitHub project-board helper (used by /triage, /build, /ship and by hand).
# Adds an issue or PR to the "Tafsila" board and sets its Status column.
#
# Usage:
#   scripts/gh-project.sh add    <issue-or-pr-url> [status]   # add to board (default status: Ready)
#   scripts/gh-project.sh status <issue-or-pr-url> <status>   # move an item to another column
#   scripts/gh-project.sh columns                              # list the Status options on the board
#
# Status names are matched case-insensitively: Backlog | Ready | In progress | In review | Done
# Requires: gh authenticated with the "project" scope (gh auth refresh -s project).
#
# In cloud agent sessions (CLAUDE_CODE_REMOTE=true) GitHub GraphQL is blocked, so this is a no-op:
# the board-sync workflow moves the card from the status:* label (issue #183).
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" = "true" ] && [ "${1:-}" != "columns" ]; then
  echo "ℹ board move skipped: cloud session has no GraphQL. The board-sync workflow moves the card from the status:* label."
  exit 0
fi

OWNER="${TAFSILA_PROJECT_OWNER:-merna550}"
NUMBER="${TAFSILA_PROJECT_NUMBER:-4}"
FIELD="Status"

project_id() { gh project view "$NUMBER" --owner "$OWNER" --format json --jq '.id'; }
field_id() {
  gh project field-list "$NUMBER" --owner "$OWNER" --format json \
    --jq ".fields[] | select(.name==\"$FIELD\") | .id"
}
option_id() {
  local wanted
  wanted="$(echo "$1" | tr '[:upper:]' '[:lower:]')"
  gh project field-list "$NUMBER" --owner "$OWNER" --format json \
    --jq ".fields[] | select(.name==\"$FIELD\") | .options[] | select((.name|ascii_downcase)==\"$wanted\") | .id"
}
# item-add returns the existing item when the issue/PR is already on the board, so it is safe to repeat.
item_id() { gh project item-add "$NUMBER" --owner "$OWNER" --url "$1" --format json --jq '.id'; }

set_status() {
  local url="$1" status="$2" item opt
  item="$(item_id "$url")"
  opt="$(option_id "$status")"
  if [ -z "$opt" ]; then
    echo "✘ Status \"$status\" not found on the board. Available:" >&2
    "$0" columns >&2
    exit 1
  fi
  gh project item-edit --id "$item" --project-id "$(project_id)" --field-id "$(field_id)" \
    --single-select-option-id "$opt" >/dev/null
  echo "✔ $url → board \"$status\""
}

case "${1:-}" in
  add) set_status "${2:?url required}" "${3:-Ready}" ;;
  status) set_status "${2:?url required}" "${3:?status required}" ;;
  columns)
    gh project field-list "$NUMBER" --owner "$OWNER" --format json \
      --jq ".fields[] | select(.name==\"$FIELD\") | .options[].name"
    ;;
  *) sed -n '2,16p' "$0"; exit 1 ;;
esac
