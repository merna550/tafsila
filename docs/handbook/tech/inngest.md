---
packages: [inngest]
level: intermediate
adr: ADR-012
---

# Inngest

**In one line:** Runs slow background work (AI photo analysis, PDF export, nesting) with automatic retries, without us running Redis or queue servers. Planned for M4 to M6; the dev server already runs in Compose.

## What it is (plain words)

You write a function and name the event that triggers it. Inngest calls it over HTTP, retries on failure, and lets you split it into steps that survive restarts. Our code stays a normal TypeScript function inside the Next.js app at `/api/inngest`.

## Why we chose it

- **Some work is too slow for a web request.** AI analysis of a photo can take many seconds; PDF tiling and fabric nesting are heavy. Running them as jobs keeps the UI responsive and lets us show progress.
- **Retries and idempotency out of the box,** which matters when the AI provider times out or a payment webhook arrives twice ([glossary: idempotency](../glossary.md#idempotency)).
- **No queue infrastructure to run alone.** No Redis, no workers, no Kafka. Message streaming like Kafka or Redpanda is not needed at our scale.
- **Local dev server.** `docker compose up -d` starts Inngest on port 8288 so jobs run locally exactly as in the cloud.
- **Behind a `JobQueue` port,** so swapping vendors is an adapter change ([ADR-006](../../DECISIONS.md)).

## Alternatives we considered (and why not)

- **BullMQ + Redis:** infrastructure to run and monitor.
- **Trigger.dev:** comparable; the SRS allows it as the fallback.
- **QStash:** simple but less workflow support (steps, retries per step).
- **Kafka / Redpanda:** massive overkill.

## When we would change it

Checked on 2026-10-07 at [inngest.com/pricing](https://www.inngest.com/pricing): the free plan has 50,000 executions per month and 5 concurrent steps, and **pauses once the free quota is used** (no overage), so we plan to move to a paid plan before launch traffic. Revisit if volume or cost makes a self-hosted queue cheaper.

## Where it lives in our code

- `compose.yaml` (service `inngest`, dev server at `http://localhost:8288`).
- Jobs will live in packages/api/src/jobs/ (planned) and be served at `/api/inngest`.

## The 20% you need

- An event (`pattern/generate.requested`) triggers a function; each `step.run` is saved, so a retry resumes after the last finished step.
- Jobs must be idempotent: running twice must not charge twice.

```yaml
# compose.yaml
inngest:
  image: inngest/inngest:latest
  command: "inngest dev -u http://host.docker.internal:3000/api/inngest"
  ports: ["8288:8288"]
```

## Commands you'll use

`docker compose up -d` (starts the dev server), then open `http://localhost:8288`.

## Common mistakes

- Doing database writes outside a step, so a retry repeats them.
- Forgetting that the dev server needs the app running on port 3000.

## Learn more

- [Inngest docs](https://www.inngest.com/docs) (official)
- Glossary: [Inngest](../glossary.md#inngest), [webhook](../glossary.md#webhook)
