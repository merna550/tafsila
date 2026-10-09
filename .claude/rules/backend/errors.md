---
paths:
  - "packages/api/src/**"
  - "docs/errors.md"
---

# Errors (ADR-030)

- Every error body is `{ code, message_ar, message_en, details?, request_id }`, produced only by `middleware/error-handler.ts`. Routes and use cases throw; they never build an error response.
- Codes live in `ERROR_CATALOGUE` (`domain/errors.ts`) with an Arabic and an English message. A new code is added there and as a row in `docs/errors.md` in the same PR; `errors.test.ts` fails when a thrown code is missing from either, or has no Arabic message.
- Validation failures put per-field messages in `details.fields` (`ValidationError`), which the web form shows under each field.
- Never put stack traces, SQL, ids of other users or provider messages in a body. Unexpected errors become `INTERNAL_ERROR` and go to Sentry with the request id.

```ts
// WRONG
return c.json({ error: "Not enough credits" }, 400);
throw new Error("no credits");

// RIGHT
throw new AppError("INSUFFICIENT_CREDITS"); // code added to ERROR_CATALOGUE and docs/errors.md
```
