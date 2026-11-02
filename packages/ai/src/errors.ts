/** Typed errors of the AI package (issue #337, SRS §9). */
import type { AiUsage } from "./usage";

/** The model's answer failed the schema twice: once, then once more after being shown the validation error. */
export class AiOutputInvalidError extends Error {
  /** Stable code the API maps to its error response. */
  readonly code = "AI_OUTPUT_INVALID";

  /**
   * Builds the error.
   *
   * @param operation - Which function failed (`analyzeDesign` or `proposeEdit`).
   * @param detail - The last validation error, in English.
   * @param usage - Tokens and cost of the attempts, so the caller can still record what the call cost (issue #340).
   */
  constructor(
    readonly operation: string,
    readonly detail: string,
    readonly usage?: AiUsage,
  ) {
    super(`${operation}: model output invalid after one retry: ${detail}`);
    this.name = "AiOutputInvalidError";
  }
}
