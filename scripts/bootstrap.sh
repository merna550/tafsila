#!/usr/bin/env bash
# Tafsila one-time setup for macOS. Safe to re-run.
# Isolation: Node version from .nvmrc (nvm), pnpm version from package.json (corepack),
# dependencies in this folder only, databases/services in Docker. Nothing global is upgraded.
set -euo pipefail
cd "$(dirname "$0")/.."

green() { printf "\033[32m✔ %s\033[0m\n" "$1"; }
warn()  { printf "\033[33m! %s\033[0m\n" "$1"; }
fail()  { printf "\033[31m✘ %s\033[0m\n" "$1"; exit 1; }

# 0) Install protected project files delivered in setup/dotfiles (CI, hooks, agent commands, npm settings)
if [ -d setup/dotfiles ]; then
  mkdir -p .claude .github .husky
  cp -Rn setup/dotfiles/claude/. .claude/
  cp -Rn setup/dotfiles/github/. .github/
  cp -n setup/dotfiles/husky/pre-commit .husky/pre-commit && chmod +x .husky/pre-commit
  cp -n setup/dotfiles/npmrc .npmrc
  cp -n setup/dotfiles/env.docker.example .env.docker.example
  rm -rf setup/dotfiles && rmdir setup 2>/dev/null || true
  chmod +x scripts/*.sh
  green "Project config files installed (.claude, .github, .husky, .npmrc)"
fi

# 1) Node (project version only, via nvm)
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] || fail "nvm not found. Install: https://github.com/nvm-sh/nvm#installing-and-updating"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
nvm install >/dev/null            # reads .nvmrc, installs if missing
nvm use >/dev/null
green "Node $(node --version) (from .nvmrc, this project only)"

# 2) pnpm pinned by package.json "packageManager" (corepack shim inside this Node version)
corepack enable >/dev/null 2>&1 || npm i -g corepack >/dev/null && corepack enable
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
green "pnpm $(pnpm --version) (pinned in package.json)"

# 3) Dependencies (local node_modules)
pnpm install --frozen-lockfile
green "Dependencies installed"

# 4) Local env file
[ -f .env.local ] || { cp .env.example .env.local; warn "Created .env.local from .env.example — fill the keys after 'supabase start'"; }

# 5) Git + hooks
if [ ! -d .git ]; then
  git init -b main >/dev/null
  pnpm exec husky >/dev/null
  git add -A && git commit -m "chore: initial project foundation (M0)" >/dev/null
  green "Git repository created with the first commit on main"
else
  pnpm exec husky >/dev/null
  green "Git hooks installed"
fi

# 6) External tools (checked, not installed)
check() { command -v "$1" >/dev/null && green "$1 found" || warn "$1 missing — install: $2"; }
check docker   "Docker Desktop: https://www.docker.com/products/docker-desktop/"
check supabase "brew install supabase/tap/supabase"
check gh       "brew install gh && gh auth login"
check uv       "(needed only for services/sim in v2) brew install uv"
if command -v supabase >/dev/null && [ ! -f supabase/config.toml ]; then
  supabase init >/dev/null && green "Supabase project config created"
fi

# 7) Verify
pnpm quality && pnpm test && green "All checks pass — run 'pnpm dev' and open http://localhost:3000"
