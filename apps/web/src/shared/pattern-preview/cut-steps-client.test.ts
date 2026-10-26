import { describe, expect, it } from "vitest";
import { createPreviewClient } from "./preview-client";
import { createFakeWorker, okResponse } from "./test-support";

const input = { spec: 1, measurements: 2 };
const plan = { engineVersion: "1.4.0", curveStepMm: 30, pieces: [] };

describe("preview client: cut steps", () => {
  it("posts a cut-steps request with the curve step and resolves with the plan", async () => {
    const worker = createFakeWorker();
    const client = createPreviewClient(() => worker);
    const pending = client.runCutSteps(input, 30);
    expect(worker.requests[0]).toMatchObject({ kind: "cut-steps", curveStepMm: 30, spec: 1 });
    worker.answer({ id: worker.requests[0]!.id, kind: "cut-steps", ok: true, plan });
    expect(await pending).toMatchObject({ ok: true, plan });
  });

  it("resolves an engine error as ok: false", async () => {
    const worker = createFakeWorker();
    const client = createPreviewClient(() => worker);
    const pending = client.runCutSteps(input, 25);
    worker.answer({ id: 1, kind: "cut-steps", ok: false, error: { code: "X", message: "m" } });
    expect(await pending).toMatchObject({ ok: false, error: { code: "X" } });
  });

  it("lets the latest request win", async () => {
    const worker = createFakeWorker();
    const client = createPreviewClient(() => worker);
    const first = client.runCutSteps(input, 20);
    const second = client.runCutSteps(input, 25);
    expect(await first).toMatchObject({ stale: true });
    worker.answer({ id: 2, kind: "cut-steps", ok: true, plan });
    expect(await second).toMatchObject({ ok: true });
  });

  it("fails a waiting cut-steps request with the cut-steps shape when the worker crashes", async () => {
    const worker = createFakeWorker();
    const client = createPreviewClient(() => worker);
    const pending = client.runCutSteps(input, 25);
    worker.onerror?.({});
    expect(await pending).toMatchObject({ kind: "cut-steps", ok: false, error: { code: "WORKER_FAILED" } });
  });

  it("still sends previews without a kind", async () => {
    const worker = createFakeWorker();
    const client = createPreviewClient(() => worker);
    const pending = client.run(input);
    expect(worker.requests[0]).not.toHaveProperty("kind");
    worker.answer(okResponse(1));
    expect(await pending).toMatchObject({ ok: true });
  });
});
