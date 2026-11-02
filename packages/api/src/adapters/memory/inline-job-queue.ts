/** Inline job queue: runs the job handler in the same process, deterministic, for tests, local development and CI. */
import type { JobName, JobPayloads, JobQueue } from "../../ports/job-queue";

/** Runs one job; the composition root points it at the real services. */
export type JobRunner = <N extends JobName>(name: N, payload: JobPayloads[N]) => Promise<void>;

/** The queue plus a switch that holds jobs back so tests can see the `pending` state. */
export interface InlineJobQueue extends JobQueue {
  /** Runs every held job in order (a no-op when nothing is held). */
  drain(): Promise<void>;
  /** Number of jobs held back. */
  readonly held: number;
}

/** Options of the inline queue. */
export interface InlineJobQueueOptions {
  /** Hold jobs until `drain()` instead of running them while `enqueue` waits. */
  readonly deferred?: boolean;
}

/**
 * Creates the inline queue.
 *
 * @param run - Runs one job.
 * @param options - `deferred` holds jobs until `drain()`.
 * @returns The queue.
 */
export function createInlineJobQueue(run: JobRunner, options: InlineJobQueueOptions = {}): InlineJobQueue {
  const held: (() => Promise<void>)[] = [];
  return {
    /**
     * Number of jobs held back.
     *
     * @returns The count.
     */
    get held() {
      return held.length;
    },
    enqueue(name, payload) {
      if (!options.deferred) return run(name, payload);
      held.push(() => run(name, payload));
      return Promise.resolve();
    },
    async drain() {
      while (held.length > 0) await held.shift()?.();
    },
  };
}
