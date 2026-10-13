/** Domain errors raised by the pattern engine. */

/** Stable codes for degenerate input to the geometry kit (`src/geometry/`, decision 124). */
export const GEOMETRY_ERROR_CODES = [
  "GEOMETRY_DEGENERATE_SEGMENT",
  "GEOMETRY_PATH_NOT_CLOSED",
  "GEOMETRY_LENGTH_OUT_OF_RANGE",
  "GEOMETRY_OFFSET_FAILED",
] as const;

/** One of the geometry kit's error codes. */
export type GeometryErrorCode = (typeof GEOMETRY_ERROR_CODES)[number];

/** Thrown when a pattern cannot be drafted for the given design and measurements. */
export class DraftingError extends Error {
  /**
   * Creates a drafting error with a stable machine-readable code.
   *
   * @param code - Stable identifier, e.g. "SLEEVE_CAP_UNSOLVABLE" or a {@link GeometryErrorCode}.
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
