# Decisions since ADR-035

[`docs/DECISIONS.md`](../DECISIONS.md) holds ADR-001 to ADR-035 and is closed: nobody edits it any more. From here on, **one file per decision**.

## Why

Every PR used to add its entry at the top of one file and take "the next free number". Parallel PRs edited the same lines and sometimes chose the same number, so each merge conflicted with the last one (#52, #75, #77, issue #76). A file per decision shares nothing, and the number comes from the issue, which is unique.

## How

- File: `docs/decisions/<issue>-<slug>.md`, for example `76-shared-file-conflicts.md`. `<issue>` is the number of the issue that makes the decision. If one issue makes two decisions, add a letter: `76a-…`, `76b-…`.
- First line: `# ADR-<issue> · <YYYY-MM-DD> · <title>` (the number matches the file name; with a letter, `ADR-76a`).
- Then, as before: **Context**, **Decision**, **Reason** (or Context), **Alternatives**. Keep it short.
- Refer to a decision as `ADR-76`. Link it with a relative link to its file.
- `pnpm docs:check` fails when two decisions share a number (in this folder or in `DECISIONS.md`), when the file name and the heading disagree, or when a file here has no issue number in its name.
