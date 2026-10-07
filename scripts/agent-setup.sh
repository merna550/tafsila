#!/usr/bin/env bash
# Prepares a fresh cloud agent session (claude.ai/code or GitHub Actions). Idempotent; runs in well under 5 minutes.
# Called by the SessionStart hook in .claude/settings.json. Never prints secrets.
set -euo pipefail
cd "$(dirname "$0")/.."

export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
corepack enable >/dev/null 2>&1 || npm i -g corepack >/dev/null && corepack enable

# Dependencies from the lockfile only (fast when node_modules is already current).
pnpm install --frozen-lockfile

# Supabase CLI is needed for db:reset and migrations; skip when present.
if ! command -v supabase >/dev/null 2>&1; then
  pnpm add -g supabase >/dev/null 2>&1 || echo "! Supabase CLI not installed (optional until supabase/ exists)"
fi

echo "agent-setup: ready (node $(node --version), pnpm $(pnpm --version))"
