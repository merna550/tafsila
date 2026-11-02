/** The Inngest function `design.analyze`: runs the same service the inline queue runs, once, with one run per design at a time. */
import { garmentCategorySchema } from "@tafsila/schemas";
import type { Inngest } from "inngest";
import { z } from "zod";
import { JOB_EVENTS, type DesignAnalyzePayload } from "../ports/job-queue";

/** The part of the Inngest step tools this function uses. */
interface StepRunner {
  run(id: string, fn: () => Promise<void>): Promise<unknown>;
}

/** Shape of the event data, checked again here because the event comes over HTTP. */
const payloadSchema = z.object({
  userId: z.uuid(),
  designId: z.uuid(),
  hint: garmentCategorySchema.optional(),
});

/** One retry: the provider is paid per call, so a second attempt must be rare (decision 340). */
export const DESIGN_ANALYZE_RETRIES = 1;

/**
 * Parses the event data of a `design.analyze` run.
 *
 * @param data - Event data as received.
 * @returns The payload.
 * @throws {Error} When the data is not a valid payload.
 */
export function parseDesignAnalyzePayload(data: unknown): DesignAnalyzePayload {
  return payloadSchema.parse(data);
}

/**
 * Defines the function Inngest runs for `design.analyze`.
 *
 * @param client - The Inngest client.
 * @param run - The service that analyses the design (stores the result itself and never throws for provider errors).
 * @returns The Inngest function, to be served by `routes/inngest.ts`.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- the Inngest function type has no short name
export function createDesignAnalyzeFunction(
  client: Inngest,
  run: (payload: DesignAnalyzePayload) => Promise<void>,
) {
  return client.createFunction(
    {
      id: "design.analyze",
      triggers: [{ event: JOB_EVENTS["design.analyze"] }],
      retries: DESIGN_ANALYZE_RETRIES,
      concurrency: { limit: 1, key: "event.data.designId" },
    },
    async ({ event, step }: { event: { data: unknown }; step: StepRunner }) => {
      const payload = parseDesignAnalyzePayload(event.data);
      await step.run("analyse-design", () => run(payload));
    },
  );
}
