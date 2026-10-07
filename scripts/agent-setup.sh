#!/usr/bin/env bash
# Prepares a fresh CLOUD agent session (claude.ai/code or GitHub Actions). Idempotent; well under 5 minutes.
# Called by the SessionStart hook in .claude/settings.json. Does nothing outside a cloud session,
# so it never touches a developer laptop. Installs from the lockfile only; no global installs, no secrets.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$(dirname "$0")/.."
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
corepack enable
pnpm install --frozen-lockfile

echo "agent-setup: ready (node $(node --version), pnpm $(pnpm --version))"
