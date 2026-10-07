---
description: Explain a term, a file or a PR in plain words, using the handbook and the real code
argument-hint: <term | file path | #PR>
---

Follow CLAUDE.md. Subject: $ARGUMENTS. Read-only: this command never edits code or docs by itself.

1. Find the subject:
   - A term: `grep -in` it in `docs/handbook/glossary.md`, then open its tech card (`docs/handbook/tech/`) or pattern page (`docs/handbook/patterns/`) if the entry links one.
   - A file path: read the file, then the handbook page that covers it (`docs/handbook/map/repo-tour.md`, tech cards, patterns).
   - `#<PR>`: `gh pr view <PR> --json title,body,files` and `gh pr diff <PR>`; read the "Concepts introduced" section and the changed files.
2. Answer in plain words, beginner first, in this order, short (about 15 lines):
   - **What it is** in one or two sentences, no jargon (define any jargon you must use).
   - **Why Tafsila uses it** (link the ADR or SRS ID).
   - **Where it is in our code**: real file paths you opened, with the 1-3 key lines; mark unbuilt things as planned.
   - **Read next**: handbook links (glossary entry, card, pattern) and the official docs.
3. If the term is missing from the glossary, say so and propose the entry in the glossary format (plain words, In Tafsila, Card, Level, Learn) with an `<a id>` anchor and its alphabetical place. Do not write it into the file unless Merna says yes; if the task you are on adds the term, add it in that PR (see `/build`).
4. If the handbook and the code disagree, say which is right and name the file to fix.
5. Reply in Arabic only if Merna writes in Arabic; keep code and file names in English.
