# تفصيلة · Tafsila

Photo → accurate, ready-to-cut sewing pattern. Egypt first, Arabic RTL.

## First time on this Mac

```bash
cd ~/Desktop/tafsila
bash scripts/bootstrap.sh
```

The script sets up an isolated environment for this project only (details: `docs/backend/tutorials/run-locally.md`).

## Daily

```bash
nvm use          # switch this terminal to the project's Node version
pnpm dev         # http://localhost:3000  ·  API health: /api/health
pnpm test        # all tests
pnpm quality     # format, lint, types, duplication, architecture
```

## Read next

`CLAUDE.md` (rules & status) · `docs/ARCHITECTURE.md` · `docs/WORKFLOW.md` · `docs/CODING_STANDARDS.md` · `docs/SRS.md`
