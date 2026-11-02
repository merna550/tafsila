import { describe, expect, it } from "vitest";
import { createInlineJobQueue } from "./inline-job-queue";

const payload = { userId: "u", designId: "d" };

describe("inline job queue", () => {
  it("runs the job while enqueue waits, and propagates its failure", async () => {
    const seen: string[] = [];
    const queue = createInlineJobQueue((name, p) => {
      seen.push(`${name}:${p.designId}`);
      return Promise.resolve();
    });
    await queue.enqueue("design.analyze", payload);
    expect(seen).toEqual(["design.analyze:d"]);
    const failing = createInlineJobQueue(() => Promise.reject(new Error("boom")));
    await expect(failing.enqueue("design.analyze", payload)).rejects.toThrow("boom");
  });

  it("holds jobs until drain when deferred", async () => {
    const seen: string[] = [];
    const queue = createInlineJobQueue(
      (_name, p) => {
        seen.push(p.designId);
        return Promise.resolve();
      },
      { deferred: true },
    );
    await queue.enqueue("design.analyze", payload);
    await queue.enqueue("design.analyze", { ...payload, designId: "e" });
    expect(queue.held).toBe(2);
    expect(seen).toEqual([]);
    await queue.drain();
    expect(seen).toEqual(["d", "e"]);
    expect(queue.held).toBe(0);
  });
});
