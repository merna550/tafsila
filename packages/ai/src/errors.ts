/** Typed errors of the AI package (issue #337, SRS §9). */

/** The model's answer failed the schema twice: once, then once more after being shown the validation error. */
export class AiOutputInvalidError extends Error {
  /** Stable code the API maps to its error response. */
  readonly code = "AI_OUTPUT_INVALID";

  /**
   * Builds the error.
   *
   * @param operation - Which function failed (`analyzeDesign` or `proposeEdit`).
   * @param detail - The last validation error, in English.
   */
  constructor(
    readonly operation: string,
    readonly detail: string,
  ) {
    super(`${operation}: model output invalid after one retry: ${detail}`);
    this.name = "AiOutputInvalidError";
  }
}
