import { describe, expect, it, vi } from "vitest";
import { createExportClient, type ExportJob, type ExportWorker } from "./export-client";
import type { ExportMessage, ExportRequest } from "./protocol";

/** A fake worker the test answers by hand. */
interface FakeWorker extends ExportWorker {
  readonly requests: ExportRequest[];
  terminated: boolean;
  answer(message: ExportMessage): void;
}

/**
 * Creates a fake worker.
 *
 * @returns The fake.
 */
function fakeWorker(): FakeWorker {
  const worker: FakeWorker = {
    requests: [],
    terminated: false,
    onmessage: null,
    onerror: null,
    postMessage: (request) => {
      worker.requests.push(request);
    },
    terminate: () => {
      worker.terminated = true;
    },
    answer: (message) => worker.onmessage?.({ data: message }),
  };
  return worker;
}

const JOB: ExportJob = {
  kind: "a4",
  input: { spec: {}, measurements: {} },
  meta: { title: "t", versionNo: 1, clientLabel: "", engineVersion: "1", createdAt: "2026-10-01T00:00:00Z" },
};
const OK = (id: number): ExportMessage => ({
  id,
  ok: true,
  kind: "a4",
  bytes: new ArrayBuffer(2),
  mime: "application/pdf",
  pageCount: 2,
  durationMs: 5,
});

/**
 * Makes a client over a list of fake workers it creates on demand.
 *
 * @returns The client and the workers created so far.
 */
function setup(): { client: ReturnType<typeof createExportClient>; workers: FakeWorker[] } {
  const workers: FakeWorker[] = [];
  const client = createExportClient(() => {
    const worker = fakeWorker();
    workers.push(worker);
    return worker;
  });
  return { client, workers };
}

describe("createExportClient", () => {
  it("creates the worker lazily on the first run", () => {
    const { client, workers } = setup();
    expect(workers).toHaveLength(0);
    void client.run(JOB, () => undefined);
    expect(workers).toHaveLength(1);
    expect(workers[0]!.requests[0]).toMatchObject({ id: 1, kind: "a4" });
  });

  it("resolves with the answer and forwards progress of the live request only", async () => {
    const { client, workers } = setup();
    const progress = vi.fn();
    const done = client.run(JOB, progress);
    workers[0]!.answer({ id: 1, progress: { done: 1, total: 3 } });
    workers[0]!.answer({ id: 99, progress: { done: 2, total: 3 } });
    workers[0]!.answer(OK(1));
    expect(await done).toMatchObject({ ok: true, pageCount: 2 });
    expect(progress).toHaveBeenCalledTimes(1);
    expect(progress).toHaveBeenCalledWith({ done: 1, total: 3 });
  });

  it("a second run resolves the first as stale and drops its late answer", async () => {
    const { client, workers } = setup();
    const first = client.run(JOB, () => undefined);
    const second = client.run({ ...JOB, kind: "svg" }, () => undefined);
    expect(await first).toEqual({ id: 1, stale: true });
    workers[0]!.answer(OK(1));
    workers[0]!.answer({ ...OK(2), kind: "svg" } as ExportMessage);
    expect(await second).toMatchObject({ id: 2, ok: true });
  });

  it("cancel resolves stale, terminates the worker and the next run starts a new one", async () => {
    const { client, workers } = setup();
    const running = client.run(JOB, () => undefined);
    client.cancel();
    expect(await running).toEqual({ id: 1, stale: true });
    expect(workers[0]!.terminated).toBe(true);
    void client.run(JOB, () => undefined);
    expect(workers).toHaveLength(2);
  });

  it("a worker error becomes WORKER_FAILED and the worker is replaced on the next run", async () => {
    const { client, workers } = setup();
    const running = client.run(JOB, () => undefined);
    workers[0]!.onerror?.({});
    expect(await running).toMatchObject({ ok: false, error: { code: "WORKER_FAILED" } });
    void client.run(JOB, () => undefined);
    expect(workers).toHaveLength(2);
  });

  it("dispose resolves the waiting run as stale and terminates", async () => {
    const { client, workers } = setup();
    const running = client.run(JOB, () => undefined);
    client.dispose();
    expect(await running).toEqual({ id: 1, stale: true });
    expect(workers[0]!.terminated).toBe(true);
  });
});
