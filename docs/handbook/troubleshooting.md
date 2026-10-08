# Troubleshooting

Real problems we hit in this repo and how they were fixed. Add a new entry whenever you solve something that cost more than ten minutes.

Entry format: **Symptom** (the error text) · **Cause** · **Fix** (commands) · **How to avoid**.

| Entry                                                                               | Area        |
| ----------------------------------------------------------------------------------- | ----------- |
| [`pnpm dev` fails: wrong Node version](#pnpm-dev-fails-wrong-node-version)          | Node, pnpm  |
| [hadolint DL3018 fails the Docker CI job](#hadolint-dl3018-fails-the-docker-ci-job) | Docker, CI  |
| [`gh project link` owner error](#gh-project-link-owner-error)                       | GitHub CLI  |
| [`claude` is installed but prints nothing](#claude-is-installed-but-prints-nothing) | Claude Code |

## `pnpm dev` fails: wrong Node version

**Symptom:** pnpm refuses to run any script and prints something like:

```
ERR_PNPM_UNSUPPORTED_ENGINE  Unsupported environment (bad pnpm and/or Node.js version)
Expected version: >=22.22.2 <23
Got: v22.12.0
```

**Cause:** the repo requires Node `>=22.22.2 <23` (`engines` in `package.json`), and `.npmrc` sets `engine-strict=true`, so an older Node is a hard error instead of a silent problem. The terminal was still on an older Node 22 (for example 22.12) because `nvm use` had not been run for this project.

**Fix:**

```bash
cd ~/Desktop/tafsila
nvm use          # reads .nvmrc (22); use `nvm install` first if that 22.x is missing
node --version   # must print v22.22.2 or newer 22.x
pnpm dev
```

If `nvm use` selects an older 22.x than required, run `nvm install 22` to get the newest 22.x and `nvm use` again.

**How to avoid:** make zsh switch automatically when you `cd` into the project. Add this to `~/.zshrc` (from the [nvm documentation](https://github.com/nvm-sh/nvm#zsh), "Calling nvm use automatically in a directory with a .nvmrc file"):

```bash
autoload -U add-zsh-hook
load-nvmrc() {
  local nvmrc_path
  nvmrc_path="$(nvm_find_nvmrc)"
  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version
    nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")
    if [ "$nvmrc_node_version" = "N/A" ]; then
      nvm install
    elif [ "$nvmrc_node_version" != "$(nvm version)" ]; then
      nvm use
    fi
  elif [ -n "$(PWD=$OLDPWD nvm_find_nvmrc)" ] && [ "$(nvm version)" != "$(nvm version default)" ]; then
    echo "Reverting to nvm default version"
    nvm use default
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

See also `docs/backend/tutorials/run-locally.md` (isolated environment) and the glossary entries for [nvm](glossary.md#nvm) and [engine-strict](glossary.md#engine-strict).

## hadolint DL3018 fails the Docker CI job

**Symptom:** the `Docker image` workflow fails at the hadolint step:

```
apps/web/Dockerfile:14 DL3018 warning: Pin versions in apk add. Instead of `apk add <package>` use `apk add <package>=<version>`
```

(the CI runs hadolint with `failure-threshold: warning`, see `.github/workflows/docker.yml`).

**Cause:** hadolint wants every `apk add` package pinned. We decided not to pin them ([ADR-007](../DECISIONS.md)): Alpine deletes old package versions from its mirrors, so pinned versions break future builds. The first attempt to silence the rule put explanatory text on the same line as the ignore comment, for example `# hadolint ignore=DL3018 because ...`. hadolint does not honour inline text after the rule list, so the ignore did not apply.

**Fix:** keep `# hadolint ignore=DL3018` alone on its own line, directly above the `RUN`, and put the explanation in separate comment lines above it. This is how `apps/web/Dockerfile` looks:

```dockerfile
# Alpine deletes old package versions from its mirrors, so pinning apk packages breaks future builds.
# Reproducibility comes from the pinned base image tag instead.
# hadolint ignore=DL3018
RUN apk add --no-cache libc6-compat
```

**How to avoid:** never write free text after `# hadolint ignore=`; only the rule codes. Reproducibility comes from the pinned base image tag. You can run the same check locally with `docker run --rm -i hadolint/hadolint < apps/web/Dockerfile`.

## `gh project link` owner error

**Symptom:** linking the project board to the repository with the GitHub CLI fails with an error about the owner (the CLI cannot work out which owner or repository you mean).

**Cause:** `gh project link` needs the owner and repository spelled out explicitly when it is not run in a way the CLI can infer them. The board belongs to the user `merna550`, project number 4 (see [WORKFLOW section 8](../WORKFLOW.md)).

**Fix:** pass them explicitly:

```bash
gh project link 4 --owner merna550 --repo merna550/tafsila
```

Project commands also need the `project` scope once: `gh auth refresh -s project` (see `scripts/gh-project.sh`).

**How to avoid:** use the helper `scripts/gh-project.sh add <url> [column]` and `status <url> <column>` instead of calling `gh project` by hand.

## `claude` is installed but prints nothing

**Symptom:** typing `claude` in the terminal shows no output, or the shell cannot find it.

**Cause:** the directory where the Claude Code installer puts the command (`~/.local/bin`) is not on the shell's `PATH`, so the terminal is not running the program you installed.

**Fix:**

```bash
claude --version                      # if this prints a version, it is installed and on PATH
ls ~/.local/bin/claude                # the file should exist
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
claude --version
```

**How to avoid:** after installing any command-line tool, open a new terminal and run `<tool> --version` once. Official docs: [Claude Code setup](https://docs.claude.com/en/docs/claude-code/setup).

## A user reports an error and I do not know where to start

**Symptom:** "something went wrong" with no detail.

**Cause:** the failure is in Sentry and the logs, not on your screen.

**Fix:** ask for the request id shown in the error (or the `x-request-id` header), then follow [find a bug from a report](find-a-bug-from-a-report.md).

**How to avoid:** always include `request_id` when reporting an API problem.
