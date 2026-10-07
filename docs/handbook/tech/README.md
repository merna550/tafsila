# Technology cards

One short card per technology: what it is in plain words, **why we chose it**, what we rejected, and when we would change our mind. The cards are written in issue #9; this page is the index they are added to.

- Template: [_TEMPLATE.md](_TEMPLATE.md) (copy it, keep every heading).
- Decisions that already exist: [DECISIONS.md](../../DECISIONS.md). A card links to its ADR when there is one.
- Stack overview: [SRS section 3.1](../../SRS.md).

## Index

| Card                    | Level | ADR | Covers |
| ----------------------- | ----- | --- | ------ |
| _none yet, added by #9_ |       |     |        |

## How to add a card

1. Copy `_TEMPLATE.md` to `tech/<name>.md` (lowercase, hyphens).
2. Fill the front matter (`packages`, `level`, `adr`) and every section. Use real paths from this repo in "Where it lives in our code".
3. Add a row to the index above, sorted by name.
4. Link the card from the matching [glossary](../glossary.md) entries (the `Card:` field).
