---
packages: [fastapi, uvicorn, pygarment]
level: advanced
adr: ADR-001
---

# Python, FastAPI and GarmentCode (v2)

**In one line:** The one place we use Python: a separate 3D cloth-simulation service for the post-launch assembly preview.

## What it is (plain words)

GarmentCode is a research toolkit (published on PyPI as `pygarment`) for programming sewing patterns and simulating how cloth drapes. FastAPI is a Python web framework; Uvicorn is the server that runs it. The service runs in its own container and is called through a job queue.

## Why we chose it

- **The simulation research tools are Python,** and rewriting them in TypeScript would take far longer than the feature is worth.
- **Isolated behind the `JobQueue` port** in `services/sim`, so the rest of Tafsila stays TypeScript ([ADR-001](../../DECISIONS.md)). The two sides share data through [JSON Schema exported from Zod](zod.md), not copied types.
- **FastAPI** gives typed request models and automatic docs with little code.
- **Post-launch.** The 3D preview moved to Post-launch ([ADR-009](../../DECISIONS.md)); only the Dockerfile template exists now.

## Alternatives we considered (and why not)

- **Rewriting the simulation in TypeScript:** large effort for research code.
- **Running Python inside the Node app:** hard to deploy and scale.

## When we would change it

When we start the 3D work, we re-check that GarmentCode's licence and maturity fit commercial use, and whether a JavaScript physics approach is good enough.

## Where it lives in our code

- `services/sim/Dockerfile` (multi-stage, uv, non-root, health check), `.python-version` (3.12).
- `compose.yaml` (service `sim`, profile `sim`); glossary: [uv](../glossary.md#uv), [sim](../glossary.md#sim).

## The 20% you need

- Python tooling is managed by `uv` with a lock file; the container runs `uvicorn sim.main:app`.
- The service exposes `/health` and accepts jobs defined by the shared schemas.

```dockerfile
# services/sim/Dockerfile
CMD ["uvicorn", "sim.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Commands you'll use

`docker compose --profile sim up -d --build` (once the service code exists).

## Common mistakes

- Redefining `DesignSpec` in Python instead of generating it from the schema.
- Treating the sim as required for the core product; it is optional.

## Learn more

- [FastAPI docs](https://fastapi.tiangolo.com/), [GarmentCode](https://github.com/maria-korosteleva/GarmentCode), [uv](https://docs.astral.sh/uv/) (official)
- Glossary: [FastAPI](../glossary.md#fastapi), [GarmentCode](../glossary.md#garmentcode)
