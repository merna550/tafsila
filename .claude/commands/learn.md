---
description: Short lesson on a topic, tied to this repo, with a tiny exercise
argument-hint: <topic>
---

Follow CLAUDE.md. Topic: $ARGUMENTS. Read-only: never edit code, docs or config; the exercise is for the learner to do (or only to read and predict).

1. Find the material: `docs/handbook/glossary.md` (grep the topic), the matching `docs/handbook/patterns/*.md` or `docs/handbook/tech/*.md`, then the real files they point to. Open those files; do not teach from memory what the repo shows.
2. Write the lesson (about 40 lines, plain words, beginner first) with these headings:
   - **Concept**: what it is and the problem it solves, with one small analogy (sewing analogies are welcome).
   - **Where it is in Tafsila**: 2-3 real paths with the key lines quoted; say **planned** for anything not built yet.
   - **Tiny exercise** (10 minutes max, inside this repo): a read-only task such as "open X, find Y, predict what happens if Z", or a safe command to run (`pnpm test`, `grep`, `git log`). State the expected answer under a "Check yourself" line.
   - **Links**: glossary entry, tech card or pattern page, then the official docs.
3. If the topic is not in the handbook, say so, give the best short lesson you can from the code and official docs, and propose the glossary entry or card that is missing (do not create it).
