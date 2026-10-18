#!/usr/bin/env bash
# Fake `gh` for gh-ac.test.mjs: serves the recorded issue body over "REST" and fails on GraphQL-backed commands.
dir="$(dirname "$(readlink -f "$0")")"
case "$1" in
  api)
    if [ "$2" = "-X" ]; then cat > "$FAKE_GH_OUT"; exit 0; fi
    if [ -s "${FAKE_GH_OUT:-}" ]; then cat "$FAKE_GH_OUT"; else cat "$dir/issue-body.md"; fi ;;
  *) echo "HTTP 403: GraphQL blocked" >&2; exit 1 ;;
esac
