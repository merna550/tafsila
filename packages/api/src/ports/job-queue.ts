/** Job queue port: starts background work (ADR-012). Adapters: Inngest (staging, production) and an inline runner (local, CI). */
import type { GarmentCategory } from "@tafsila/schemas";

/** What the `design.analyze` job needs: who asked, which design, and the optional category hint. */
export interface DesignAnalyzePayload {
  readonly userId: string;
  readonly designId: string;
  readonly hint?: GarmentCategory;
}

/** The jobs the API knows, with the payload of each. */
export interface JobPayloads {
  readonly "design.analyze": DesignAnalyzePayload;
}

/** Name of a job. */
export type JobName = keyof JobPayloads;

/** Inngest event name of each job (the vendor's naming style stays in one table). */
export const JOB_EVENTS: Readonly<Record<JobName, string>> = {
  "design.analyze": "design/analyze.requested",
};

/** Starts background jobs. */
export interface JobQueue {
  /**
   * Hands a job to the queue.
   *
   * @param name - Which job.
   * @param payload - Its input.
   * @throws {Error} When the queue cannot take the job.
   */
  enqueue<N extends JobName>(name: N, payload: JobPayloads[N]): Promise<void>;
}
