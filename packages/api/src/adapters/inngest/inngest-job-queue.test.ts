import { describe, expect, it, vi } from "vitest";
import type { Inngest } from "inngest";
import { createInngestJobQueue } from "./inngest-job-queue";

describe("inngest job queue", () => {
  it("sends one event named after the job with the payload as data", async () => {
    const send = vi.fn().mockResolvedValue({ ids: ["1"] });
    const queue = createInngestJobQueue({ send } as unknown as Inngest);
    await queue.enqueue("design.analyze", { userId: "u", designId: "d", hint: "dress" });
    expect(send).toHaveBeenCalledWith({
      name: "design/analyze.requested",
      data: { userId: "u", designId: "d", hint: "dress" },
    });
  });

  it("lets a send failure through", async () => {
    const send = vi.fn().mockRejectedValue(new Error("no key"));
    await expect(
      createInngestJobQueue({ send } as unknown as Inngest).enqueue("design.analyze", {
        userId: "u",
        designId: "d",
      }),
    ).rejects.toThrow("no key");
  });
});
