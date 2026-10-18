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

# node_ok: succeeds when the running Node satisfies the `engines.node` range in package.json (>=X <Y).
node_ok() {
  node -e '
    const range = require("./package.json").engines.node;
    const [, min, max] = range.match(/>=([\d.]+)\s*<(\d+)/);
    const cur = process.versions.node.split(".").map(Number);
    const lo = min.split(".").map(Number);
    const ge = cur[0] !== lo[0] ? cur[0] > lo[0] : cur[1] !== lo[1] ? cur[1] > lo[1] : cur[2] >= lo[2];
    process.exit(ge && cur[0] < Number(max) ? 0 : 1);
  ' 2>/dev/null
}

# fetch_node: downloads the newest Node of the pinned major (.nvmrc) from nodejs.org into a cache, checks its
# SHA-256, and puts it first on PATH for this script and, through CLAUDE_ENV_FILE, for the whole session.
fetch_node() {
  local major base sums file want dir
  major="$(tr -d 'v \n' <.nvmrc | cut -d. -f1)"
  base="https://nodejs.org/dist/latest-v${major}.x"
  sums="$(curl -fsSL "$base/SHASUMS256.txt" 2>>"$log")" || return 1
  file="$(echo "$sums" | grep -o "node-v[0-9.]*-linux-x64\.tar\.xz" | head -1)"
  [ -n "$file" ] || return 1
  want="$(echo "$sums" | grep " $file\$" | cut -d' ' -f1)"
  dir="${HOME:-/tmp}/.cache/tafsila-node/${file%.tar.xz}"
  if [ ! -x "$dir/bin/node" ]; then
    mkdir -p "$dir" || return 1
    curl -fsSL "$base/$file" -o "$dir.tar.xz" 2>>"$log" || return 1
    [ "$(sha256sum "$dir.tar.xz" | cut -d' ' -f1)" = "$want" ] || return 1
    tar -xJf "$dir.tar.xz" -C "$dir" --strip-components=1 >>"$log" 2>&1 || return 1
  fi
  export PATH="$dir/bin:$PATH"
  if [ -n "${CLAUDE_ENV_FILE:-}" ]; then echo "export PATH=\"$dir/bin:\$PATH\"" >>"$CLAUDE_ENV_FILE"; fi
  return 0
}

ok=false
: >"$log"
if ! node_ok; then
  fetch_node || true
fi
if ! node_ok; then
  echo "agent-setup: FAILED (wrong Node $(node --version), need $(node -p 'require("./package.json").engines.node')). Fix: paste the Node install step in the environment setup script (docs/backend/tutorials/run-agents-in-cloud.md#fix-the-node-version), or allow nodejs.org in the environment network. Builders must stop with BLOCKED: environment; log: $log"
  exit 1
fi
corepack enable >>"$log" 2>&1
if install; then
  ok=true
fi

if [ "$ok" = true ]; then
  echo "agent-setup: ready (node $(node --version), pnpm $(pnpm --version)); log: $log"
else
  echo "agent-setup: FAILED (pnpm install); first error: $(grep -m1 'ERR' "$log" | cut -c1-160); log: $log"
  exit 1
fi
