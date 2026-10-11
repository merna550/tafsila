---
packages: [jose]
level: intermediate
adr: ADR-25a
---

# jose

**In one line:** Verifies the signed login token (JWT) that Supabase gives the browser, so the API knows who is calling without asking the database. Installed with #91.

## What it is (plain words)

A small library that checks a [JWT](../glossary.md#jwt): is the signature valid, is the issuer our Supabase project, is the audience `authenticated`, has it expired. It fetches the public keys (JWKS) from the Supabase project and caches them.

## Why we chose it

- **No database call per request.** The role travels inside the token ([access token hook](../glossary.md#access-token-hook)), so `requireAuth` needs only the public key.
- **Standard Web Crypto,** works in Node and the edge, no native code.
- **Testable.** The key source is injected, so tests sign tokens with a local key pair and never touch the network.

## Alternatives we considered (and why not)

- **`supabase.auth.getUser()` on every request:** one extra network call per API request.
- **`jsonwebtoken`:** older API, no JWKS helper.

## When we would change it

If Supabase moves to a different token format, only `adapters/supabase/jwks-token-verifier.ts` changes.

## Where it lives in our code

`packages/api/src/adapters/supabase/jwks-token-verifier.ts` (the only import of `jose` in production code), behind the `TokenVerifier` port in `packages/api/src/ports/token-verifier.ts`; used by `middleware/auth.ts`.

## The 20% you need

- `jwtVerify(token, keys, { issuer, audience })` throws on any problem; the middleware turns every throw into `UNAUTHENTICATED`.
- `createRemoteJWKSet(url)` caches keys; tests use `createLocalJWKSet`.

## Commands you'll use

`pnpm --filter @tafsila/api test`
