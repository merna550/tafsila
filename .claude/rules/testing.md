---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "e2e/**"
---

# Tests

- Each test checks one behaviour, follows Arrange–Act–Assert, and its name reads as a sentence.
- Shared sizes, measurements and designs come from `@tafsila/test-fixtures` and are never copied into a test file.
- Engine validation checks have fast-check property tests across the size matrix.
- Service tests use `memory/` adapters; they make no network calls.
- A bug fix starts with a failing test that reproduces the bug.
- E2E flows run in both `ar` and `en`.
