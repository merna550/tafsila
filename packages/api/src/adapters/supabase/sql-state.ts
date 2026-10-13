/** Reads the SQLSTATE of a driver error, so adapters can map database refusals to domain errors. */

/**
 * Reads the SQLSTATE of a driver error, whether Drizzle wrapped it or not.
 *
 * @param error - Thrown value.
 * @returns The five-character code, if any.
 */
export function sqlState(error: unknown): string | undefined {
  const own = (error as { code?: unknown }).code;
  const cause = (error as { cause?: { code?: unknown } }).cause?.code;
  const code = typeof own === "string" ? own : cause;
  return typeof code === "string" ? code : undefined;
}
