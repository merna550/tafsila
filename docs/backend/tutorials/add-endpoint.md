# Add an API endpoint

1. **Contract:** add request/response Zod schemas with `.openapi({ example })` in `packages/schemas`. Examples feed Postman and API docs.
2. **Service:** business logic in `apps/web/server/services/<area>.ts`, depending only on adapter interfaces.
3. **Adapter:** DB/storage/payment/AI calls in `apps/web/server/adapters/*`; never call Supabase or Paymob from services directly.
4. **Route:** `apps/web/app/api/<path>/route.ts` validates with the schema, checks auth, calls the service.
5. **Tests:** service unit tests with fake adapters; integration test against local Supabase; permission test (another user's data → 404).
6. **Docs:** `pnpm api:openapi && pnpm api:postman` (regenerates OpenAPI + Postman); add seed rows if needed; add test cases file; update SRS §8 table.
7. **Postman check:** run the collection on local; add an `ERR …` example for the main failure case.
