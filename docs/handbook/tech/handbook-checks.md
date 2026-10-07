---
packages: [yaml]
level: intermediate
adr: ADR-015
---

# Handbook checks (docs:check, yaml, lychee)

**In one line:** Automatic guards that keep the handbook true: every dependency has a technology card, and no link in `docs/` is broken.

## What it is (plain words)

`scripts/check-handbook.mjs` (run with `pnpm docs:check`) reads two things and compares them. First, every `package.json` in the repo: the list of libraries we depend on. Second, the `packages:` list at the top of every [technology card](README.md). If a library has no card, the check fails and names it. The same script follows every relative link and `#anchor` in `docs/` and fails on the first one that points nowhere.

The script reads card headers with the `yaml` package because that header is real YAML: Prettier may wrap a long list over several lines, and a one-line pattern match would silently miss those. [lychee](https://lychee.cli.rs/) is a separate link checker that visits the external (`https://`) links on a schedule.

## Why we chose it

- **Agents add libraries every week.** A rule in a document is forgotten; a failing check is not. The check turns "add a card" from advice into a gate ([ADR-015](../../DECISIONS.md)).
- **Broken links rot silently.** Relative links break when a file moves; external links break when a site changes. Two cheap checks catch both.
- **No new service.** A 200-line script in the repo, plus one scheduled GitHub workflow.

## Alternatives we considered (and why not)

- **markdown-link-check or remark plugins:** more dependencies, and none of them knows about our `packages:` rule.
- **Regex front matter parsing:** breaks as soon as Prettier reflows the list.
- **Review only:** reviewers miss it; the card check exists because agents add dependencies without telling anyone.
- **Failing the PR on external links:** other people's sites go down for a day; that must not block a merge, so external links are checked non-blocking and weekly.

## When we would change it

If the docs grow into a site with a framework (Docusaurus, Starlight), use its built-in link checker and keep only the dependency-card rule.

## Where it lives in our code

- `scripts/check-handbook.mjs` (the checks) and `scripts/check-handbook.test.mjs` (tests with fixture folders).
- `package.json` (`docs:check` script, part of `quality`).
- `.github/workflows/quality.yml` (runs `pnpm docs:check` on every PR).
- `.github/workflows/docs-links.yml` (lychee on docs PRs and weekly).

## The 20% you need

A card header the script accepts (a planned package that is not installed yet is fine; `packages: []` is fine too):

```yaml
---
packages: [zod, react-hook-form]
level: beginner
adr: ADR-001
---
```

Rules: every direct dependency except `@tafsila/*` and `@types/*` must appear in some card; card packages never have to be installed.

## Commands you'll use

`pnpm docs:check` (the checks), `pnpm test` (includes the script's own tests).

## Common mistakes

- Adding a dependency and forgetting its card: the error reads `Missing tech card: "<name>"`.
- Linking to a heading you later renamed: the error reads `broken anchor`.
- Linking to a Markdown anchor on GitHub style slugs: lowercase, spaces become hyphens, punctuation dropped; glossary entries also have explicit `<a id="...">` anchors.

## Learn more

- [yaml package](https://eemeli.org/yaml/) (official), [YAML spec](https://yaml.org/spec/1.2.2/)
- [lychee](https://lychee.cli.rs/) and [lychee-action](https://github.com/lycheeverse/lychee-action) (official)
