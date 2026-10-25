import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPreviewClient } from "./preview-client";
import {
  createPreviewController,
  PATTERN_PREVIEW_DEBOUNCE_MS,
  type PreviewState,
} from "./preview-controller";
import { createFakeWorker, okResponse } from "./test-support";

/**
 * Lets pending promise callbacks run.
 *
 * @returns A promise that settles after the pending callbacks.
 */
const flush = (): Promise<void> => Promise.resolve().then(() => Promise.resolve());

/**
 * Builds a controller on a fake worker and collects its states.
 *
 * @returns The worker, client, collected states and controller.
 */
function setup() {
  const worker = createFakeWorker();
  const client = createPreviewClient(() => worker);
  const states: PreviewState[] = [];
  const controller = createPreviewController(client, (s) => states.push(s));
  return { worker, client, states, controller };
}

describe("preview controller", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("sends one request for two inputs inside the debounce window", () => {
    const { worker, controller } = setup();
    controller.submit({ spec: 1, measurements: 1 });
    vi.advanceTimersByTime(PATTERN_PREVIEW_DEBOUNCE_MS - 10);
    controller.submit({ spec: 2, measurements: 1 });
    vi.advanceTimersByTime(PATTERN_PREVIEW_DEBOUNCE_MS);
    expect(worker.requests).toHaveLength(1);
    expect(worker.requests[0]?.spec).toBe(2);
  });

  it("reports done with the result, the time and the input hash", async () => {
    const { worker, controller, states } = setup();
    controller.submit({ spec: 1, measurements: 1 });
    vi.advanceTimersByTime(PATTERN_PREVIEW_DEBOUNCE_MS);
    expect(states.at(-1)?.status).toBe("running");
    worker.answer(okResponse(1, "abc"));
    await flush();
    expect(states.at(-1)).toMatchObject({
      status: "done",
      durationMs: 12,
      inputHash: "abc",
      scene: { pieces: [] },
    });
  });

  it("drops a slow first answer that arrives after the second request", async () => {
    const { worker, controller, states } = setup();
    controller.submit({ spec: 1, measurements: 1 });
    vi.advanceTimersByTime(PATTERN_PREVIEW_DEBOUNCE_MS);
    controller.submit({ spec: 2, measurements: 1 });
    vi.advanceTimersByTime(PATTERN_PREVIEW_DEBOUNCE_MS);
    worker.answer(okResponse(1, "old"));
    await flush();
    expect(states.some((s) => s.inputHash === "old")).toBe(false);
    worker.answer(okResponse(2, "new"));
    await flush();
    expect(states.at(-1)?.inputHash).toBe("new");
  });

  it("turns an error answer into the error state with its code", async () => {
    const { worker, controller, states } = setup();
    controller.submit({ spec: 1, measurements: 1 });
    vi.advanceTimersByTime(PATTERN_PREVIEW_DEBOUNCE_MS);
    worker.answer({ id: 1, ok: false, error: { code: "SEWING_PAIR_UNCOVERED", message: "x" } });
    await flush();
    expect(states.at(-1)).toMatchObject({ status: "error", error: { code: "SEWING_PAIR_UNCOVERED" } });
  });

  it("goes back to idle for a null input and sends nothing", () => {
    const { worker, controller, states } = setup();
    controller.submit({ spec: 1, measurements: 1 });
    controller.submit(null);
    vi.advanceTimersByTime(PATTERN_PREVIEW_DEBOUNCE_MS * 2);
    expect(worker.requests).toHaveLength(0);
    expect(states.at(-1)?.status).toBe("idle");
  });

  it("terminates the worker on dispose and ignores late answers", async () => {
    const { worker, client, controller, states } = setup();
    controller.submit({ spec: 1, measurements: 1 });
    vi.advanceTimersByTime(PATTERN_PREVIEW_DEBOUNCE_MS);
    controller.dispose();
    client.dispose();
    worker.answer(okResponse(1));
    await flush();
    expect(worker.terminated).toBe(true);
    expect(states.at(-1)?.status).toBe("running");
  });

  it("reports a worker that fails to load as an error", async () => {
    const { worker, controller, states } = setup();
    controller.submit({ spec: 1, measurements: 1 });
    vi.advanceTimersByTime(PATTERN_PREVIEW_DEBOUNCE_MS);
    worker.onerror?.({});
    await flush();
    expect(states.at(-1)).toMatchObject({ status: "error", error: { code: "WORKER_FAILED" } });
  });
});
