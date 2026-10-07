#!/usr/bin/env bash
# Prepares a fresh CLOUD agent session (claude.ai/code or GitHub Actions). Idempotent; well under 5 minutes.
# Called by the SessionStart hook in .claude/settings.json and by claude.yml. Does nothing outside a cloud
# session (CLAUDE_CODE_REMOTE or GITHUB_ACTIONS), so it never touches a developer laptop. Installs from the
# lockfile only; no global installs, no secrets.
# Token saving (issue #17): all output goes to a log file; the agent sees one summary line.
set -uo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ] && [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  exit 0
fi

cd "$(dirname "$0")/.." || exit 1
log="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/agent-setup.log"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# install: runs `pnpm install` from the lockfile with any extra flags, appending to the log.
install() {
  pnpm install --frozen-lockfile "$@" >>"$log" 2>&1
}

note=""
ok=false
corepack enable >"$log" 2>&1
if install; then
  ok=true
elif grep -q 'ERR_PNPM_UNSUPPORTED_ENGINE' "$log" && install --config.engine-strict=false; then
  # The cloud image may ship a Node 22 patch below the `engines` pin; retry without that check only (ADR-017).
  ok=true
  note=", engines check relaxed"
fi

if [ "$ok" = true ]; then
  echo "agent-setup: ready (node $(node --version), pnpm $(pnpm --version)${note}); log: $log"
else
  echo "agent-setup: FAILED (pnpm install); first error: $(grep -m1 'ERR' "$log" | cut -c1-160); log: $log"
  exit 1
fi
