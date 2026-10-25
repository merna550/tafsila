/** Reads what the pattern page needs from a failed save. */
import type { ValidationReport } from "@tafsila/schemas";
import { ApiError } from "@/shared/api";

/**
 * The failed validation report of a refused save (422 `PATTERN_INVALID`), shown in the report panel, not as a toast.
 *
 * @param error - Anything a failed save threw.
 * @returns The server's report, or null for any other error.
 */
export function patternInvalidReport(error: unknown): ValidationReport | null {
  if (!(error instanceof ApiError) || error.code !== "PATTERN_INVALID") return null;
  return error.report ?? null;
}
