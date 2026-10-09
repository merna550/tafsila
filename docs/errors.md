# Error catalogue

Every error the API returns has a code defined in `ERROR_CATALOGUE` (`packages/api/src/domain/errors.ts`). The body is always `{ code, message_ar, message_en, details?, request_id }` (ADR-030). A test (`errors.test.ts`) fails when a thrown code is missing from the catalogue or from this table, or when its Arabic message is missing.

How the web app shows each case: [docs/frontend/README.md](frontend/README.md#error-display).

| Code                | HTTP | Arabic message (shown to users)                   | English message                            | Cause                                                                   | Fix                                                      | Thrown where                           |
| ------------------- | ---- | ------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------- |
| `VALIDATION_FAILED` | 400  | في بيانات غير صحيحة، راجعي الحقول وحاولي مرة أخرى | Some fields are invalid                    | Request body or query failed its Zod schema                             | Correct the fields listed in `details.fields`            | `ValidationError`, route input parsing |
| `UNAUTHENTICATED`   | 401  | انتهت الجلسة، سجّلي الدخول مرة أخرى               | Sign-in required or session expired        | Missing, invalid or expired session token                               | Sign in again                                            | Auth middleware (M1)                   |
| `FORBIDDEN`         | 403  | ليس لديك صلاحية لهذا الإجراء                      | You do not have permission for this action | Signed-in user lacks the role or plan for the action                    | Use an allowed account or plan                           | Use cases (authorization)              |
| `NOT_FOUND`         | 404  | العنصر المطلوب غير موجود                          | Resource not found                         | Unknown route, or a resource that does not exist or is not the caller's | Check the id; another user's data also returns this      | `NotFoundError`, `app.notFound`        |
| `RATE_LIMITED`      | 429  | طلبات كتير، حاولي مرة أخرى بعد شوية               | Too many requests, retry later             | Caller exceeded a throttle                                              | Wait and retry                                           | `routes/debug.ts`, rate limiter (M1)   |
| `INTERNAL_ERROR`    | 500  | حدث خطأ غير متوقع، حاولي مرة أخرى                 | Unexpected error, please try again         | Any error that is not an `AppError`; reported to Sentry                 | Give the `request_id` to the team; check Sentry and logs | `middleware/error-handler.ts`          |

## Adding a code

1. Add it to `ERROR_CATALOGUE` with both messages (Arabic first).
2. Add a row above.
3. Throw it with `new AppError("CODE", { details })` from a use case; never build an error body by hand.
