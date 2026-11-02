/** JobQueue adapter that sends an Inngest event; Inngest then calls our `/api/inngest` route to run the function. */
import type { Inngest } from "inngest";
import { JOB_EVENTS, type JobQueue } from "../../ports/job-queue";

/**
 * Creates the Inngest job queue.
 *
 * @param client - The Inngest client.
 * @returns A JobQueue that sends one event per job.
 */
export function createInngestJobQueue(client: Inngest): JobQueue {
  return {
    async enqueue(name, payload) {
      await client.send({ name: JOB_EVENTS[name], data: { ...payload } });
    },
  };
}
