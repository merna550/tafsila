# 111 - Test access to api_app and JSON loading in e2e

Status: accepted (issue #111)

- `postgres` is granted `api_app` with `set true, inherit false` so pgTAP can run `set role api_app`. It adds no table privileges and `api_app` stays non-superuser, `nobypassrls` (ADR-035).
- The e2e spec reads the messages files with `readFileSync` instead of a bare JSON import, which native ESM in Playwright rejects.
