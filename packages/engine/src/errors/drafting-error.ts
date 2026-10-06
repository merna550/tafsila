/** Domain errors raised by the pattern engine. */

/** Thrown when a pattern cannot be drafted for the given design and measurements. */
export class DraftingError extends Error {
  /**
   * Creates a drafting error with a stable machine-readable code.
   *
   * @param code - Stable identifier, e.g. "SLEEVE_CAP_UNSOLVABLE".
   * @param message - Human-readable explanation for logs.
   */
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "DraftingError";
  }
}
