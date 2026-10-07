---
paths:
  - "packages/api/src/routes/**"
---

# API routes

- A route validates input with a Zod schema from `packages/schemas`, calls one service, and maps the result; it holds no business logic.
- Request and response schemas carry `.openapi({ example })` so OpenAPI and Postman stay complete.
- Errors are thrown as domain errors and leave the API as `{ code, message_ar, message_en, details? }`.
- A route that reads user data checks ownership; another user's resource returns 404.
- After any route change, run `pnpm api:openapi && pnpm api:postman && pnpm api:test`.
