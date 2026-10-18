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

/**
 * Stable codes for body proportions the bodice block cannot draft (issue #128). They are input errors: the
 * pipeline turns them into a `fail` result, never a throw.
 */
export const BODICE_ERROR_CODES = [
  "BODICE_SHOULDER_INVALID",
  "BODICE_LENGTHS_INVALID",
  "BODICE_BUST_POINT_OUT_OF_BLOCK",
] as const;

/** One of the bodice block's error codes. */
export type BodiceErrorCode = (typeof BODICE_ERROR_CODES)[number];

/** Stable codes for bodies the set-in sleeve block cannot draft (issue #134); input errors like the bodice codes. */
export const SLEEVE_ERROR_CODES = ["SLEEVE_CAP_UNSOLVABLE", "SLEEVE_LENGTH_TOO_SHORT"] as const;

/** One of the sleeve block's error codes. */
export type SleeveErrorCode = (typeof SLEEVE_ERROR_CODES)[number];

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
