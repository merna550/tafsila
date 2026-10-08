# Find a bug from a user report

A user says "it did not work". This is the path from that sentence to the line of code, using Sentry, the request id and the logs (issue #21, [ADR-025](../DECISIONS.md)).

## 1. Get the request id

Every API response has an `x-request-id` header, and every error body has a `request_id` field. Ask the user (or support) for the id shown with the error. Without it, ask for the time, the environment (staging or production) and what they were doing.

## 2. Find the event in Sentry

1. Open the project in Sentry, filter by `environment` (`staging` or `production`).
2. Search `request_id:<the id>`. The event shows the stack trace (readable thanks to uploaded [source maps](glossary.md#source-map)), the `release` (the git SHA of the deployed build) and the opaque user id. No email, phone, cookies or request bodies are collected.

## 3. Read the logs

The API logs one JSON line per unexpected error: `{"level":"error","request_id":"...","message":"..."}`. Search the hosting logs (Vercel project, Logs) for the same id to see the request around the failure.

## 4. Go to the code

Use the `release` SHA: `git checkout <sha>` (or open it on GitHub) so you read the code that actually ran. The stack trace names the file and line. Write a failing test first, then fix ([WORKFLOW](../WORKFLOW.md)).

## 5. Check product context in PostHog

The event stream shows `app_opened` and `signup_started` (more later). Events never contain measurements, photos, phone or email: the schemas in `packages/schemas/src/analytics-events.ts` reject them.

## Proving the pipeline works

`GET <staging url>/api/debug/error` throws a test error (once a minute per instance, 404 in production). It must appear in Sentry with the same `request_id` as the response header.

## Cookie and consent note (for M8)

Analytics currently keeps no cookie or localStorage (`persistence: "memory"`), autocapture and session recording are off. When M8 adds the privacy policy and consent banner, revisit: persistent identifiers, session replay and the PostHog region (US today, ADR-025). Do this before real users sign up.

See also: [Sentry and PostHog card](tech/sentry-posthog.md), [troubleshooting](troubleshooting.md).
