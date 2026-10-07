# Tafsila handbook

One place that explains every term, technology, pattern and code style used in this repo, in plain English, with links to learn more.

Tafsila is built mostly by AI agents and reviewed by a human. The handbook exists so that anyone who opens the repo (the owner learning, a future teammate, a student, a beginner) can understand what they see.

## What is in it

| Need                                         | Open                                             |
| -------------------------------------------- | ------------------------------------------------ |
| "Where do I start?" (reading paths by role)  | [START_HERE.md](START_HERE.md)                   |
| The whole system on one page                 | [map/overview.md](map/overview.md)               |
| What happens when the browser calls the API  | [map/request-journey.md](map/request-journey.md) |
| How a garment photo becomes a sewing pattern | [map/pattern-journey.md](map/pattern-journey.md) |
| What every folder and config file is         | [map/repo-tour.md](map/repo-tour.md)             |
| A word I do not know (software or sewing)    | [glossary.md](glossary.md)                       |
| The architecture and code patterns we use    | [patterns/](patterns/)                           |
| The coding rules, explained with examples    | [code-style.md](code-style.md)                   |
| Why we chose a technology (one card each)    | [tech/README.md](tech/README.md)                 |
| Something broke                              | [troubleshooting.md](troubleshooting.md)         |
| Which concepts each PR introduced            | [learning-log.md](learning-log.md)               |

## Rules of the handbook

1. **Plain words first, jargon second.** Short paragraphs, tables, diagrams (Mermaid, rendered by GitHub).
2. **Link, do not duplicate.** These stay the source of truth; the handbook explains and links to them:
   [SRS](../SRS.md) (what we build) · [ARCHITECTURE](../ARCHITECTURE.md) · [CODING_STANDARDS](../CODING_STANDARDS.md) · [DECISIONS](../DECISIONS.md) (why) · [WORKFLOW](../WORKFLOW.md) (how work moves).
3. **Real code only.** Examples come from files that exist in this repo, with their path. Things that do not exist yet are marked **planned** and link to the SRS requirement or ADR that describes them.
4. **Official docs first** for every external link.
5. **English only** (the app UI is Arabic and English; the docs are English).

## How to add to it

| You did…                                      | Update                                                                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Used a new term anywhere in `docs/` or code   | Add an entry to [glossary.md](glossary.md) (A to Z, with an anchor, same format as the others)                       |
| Added or replaced a technology                | Add or edit its card in `tech/` from [tech/_TEMPLATE.md](tech/_TEMPLATE.md); update [tech/README.md](tech/README.md) |
| Introduced a new architecture or code pattern | Add a page in [patterns/](patterns/) with a "where in our code" section                                              |
| Added a top-level folder or config file       | Add it to [map/repo-tour.md](map/repo-tour.md)                                                                       |
| Hit and solved a real problem                 | Add an entry to [troubleshooting.md](troubleshooting.md) (Symptom, Cause, Fix, How to avoid)                         |
| Merged a PR that teaches a new concept        | Add a line at the top of [learning-log.md](learning-log.md)                                                          |

Every link in the handbook must resolve (relative links to files that exist, official URLs for the outside world). Small additions are fine for the cheapest model; accuracy matters more than length.
