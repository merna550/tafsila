---
paths:
  - "apps/web/src/**"
---

# Showing errors (ADR-030)

Components never read raw responses or `catch` fetch errors. `shared/api` throws a typed `ApiError` (`code`, `kind`, localized message, `fieldErrors`, `requestId`, `status`). `placementFor(error, "load" | "action")` returns where it is shown.

| Case                             | Shown as                                        |
| -------------------------------- | ----------------------------------------------- |
| Field validation (`fieldErrors`) | text under the field (`FormField`)              |
| Failed action (save, delete)     | toast                                           |
| Page data failed to load         | `ErrorState` in the page with "Try again"       |
| 401 session expired              | redirect to sign-in, then back to the same page |
| 403                              | clear "no permission" message                   |
| Offline / network                | fixed connection banner                         |
| Unknown / 5xx                    | generic Arabic message + copyable `requestId`   |

- Never show a stack, a status number, or `TypeError`. Unexpected errors go to Sentry with the request id.
- A top-level error boundary renders `ErrorState`.
- New error code: add it to `ERROR_CATALOGUE` and `docs/errors.md` first (backend rules).

```tsx
// WRONG
try {
  await fetch("/api/save");
} catch (e) {
  alert(String(e));
}

// RIGHT
const save = useMutation({ mutationFn: saveClient, onError: (e) => showErrorToast(e) });
```
