import { DEFAULT_FABRIC_OPTIONS } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { createFabricClient, type FabricJob, type FabricWorker } from "./fabric-client";
import type { FabricMessage, FabricRequest } from "./protocol";

/** A fake worker the test answers by hand. */
interface FakeWorker extends FabricWorker {
  readonly requests: FabricRequest[];
  terminated: boolean;
  answer(message: FabricMessage): void;
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

const JOB: FabricJob = { input: { spec: {}, measurements: {} }, options: DEFAULT_FABRIC_OPTIONS };
const OK = (id: number): FabricMessage => ({
  id,
  ok: true,
  kinds: [],
  doesNotFit: [],
  suggestOpen: false,
  nestingVersion: "1.0.0",
});

/**
 * Makes a client over the fake workers it creates on demand.
 *
 * @returns The client and the workers created so far.
 */
function setup(): { client: ReturnType<typeof createFabricClient>; workers: FakeWorker[] } {
  const workers: FakeWorker[] = [];
  const client = createFabricClient(() => {
    const worker = fakeWorker();
    workers.push(worker);
    return worker;
  });
  return { client, workers };
}

describe("fabric client", () => {
  it("creates the worker on the first run and numbers requests", async () => {
    const { client, workers } = setup();
    expect(workers).toHaveLength(0);
    const first = client.run(JOB, () => undefined);
    workers[0]!.answer(OK(1));
    expect(await first).toMatchObject({ id: 1, ok: true });
    void client.run(JOB, () => undefined);
    expect(workers[0]!.requests.map((r) => r.id)).toEqual([1, 2]);
  });

  it("uses only the answer of the latest request", async () => {
    const { client, workers } = setup();
    const first = client.run(JOB, () => undefined);
    const second = client.run(JOB, () => undefined);
    expect(await first).toEqual({ id: 1, stale: true });
    workers[0]!.answer(OK(1));
    workers[0]!.answer(OK(2));
    expect(await second).toMatchObject({ id: 2, ok: true });
  });

  it("passes progress of the running request only", () => {
    const { client, workers } = setup();
    const stages: string[] = [];
    void client.run(JOB, (p) => stages.push(p.stage));
    workers[0]!.answer({ id: 1, progress: { stage: "draft" } });
    workers[0]!.answer({ id: 9, progress: { stage: "nest" } });
    expect(stages).toEqual(["draft"]);
  });

  it("cancel terminates the worker, resolves stale and the next run starts a new worker", async () => {
    const { client, workers } = setup();
    const running = client.run(JOB, () => undefined);
    client.cancel();
    expect(workers[0]!.terminated).toBe(true);
    expect(await running).toEqual({ id: 1, stale: true });
    void client.run(JOB, () => undefined);
    expect(workers).toHaveLength(2);
    expect(workers[1]!.requests[0]!.id).toBe(2);
  });

  it("maps a worker crash to a WORKER_FAILED answer and restarts on the next run", async () => {
    const { client, workers } = setup();
    const running = client.run(JOB, () => undefined);
    workers[0]!.onerror?.({});
    expect(await running).toMatchObject({ ok: false, error: { code: "WORKER_FAILED" } });
    void client.run(JOB, () => undefined);
    expect(workers).toHaveLength(2);
  });
});
