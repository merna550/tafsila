# syntax=docker/dockerfile:1.7
# Tafsila web app (Next.js standalone) — multi-stage, non-root, build once / run anywhere.
# Build from the repo root:  docker build -f apps/web/Dockerfile -t tafsila-web .
# Requires `output: "standalone"` in apps/web/next.config.ts and GET /api/health.
# Rule: NO environment-specific values at build time. All config is read at runtime
# (packages/config/env.ts), so the SAME image is promoted dev → staging → prod.

ARG NODE_VERSION=22

# ---------- base: pinned Node + pnpm via corepack ----------
FROM node:${NODE_VERSION}-alpine AS base
# hadolint ignore=DL3018  # Alpine removes old package versions; base image tag is pinned instead
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# ---------- pruner: keep only what apps/web needs from the monorepo ----------
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@^2 prune web --docker

# ---------- deps: install from lockfile only (cached layer) ----------
FROM base AS deps
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---------- builder: compile ----------
FROM deps AS builder
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=web

# ---------- runner: minimal runtime image ----------
FROM node:${NODE_VERSION}-alpine AS runner
ARG VERSION=dev
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.title="tafsila-web" \
      org.opencontainers.image.source="https://github.com/<owner>/tafsila" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${GIT_SHA}"
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 \
    APP_VERSION=${VERSION} GIT_SHA=${GIT_SHA}
WORKDIR /app
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
USER 1001:1001
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["wget", "-qO-", "http://127.0.0.1:3000/api/health"]
CMD ["node", "apps/web/server.js"]
