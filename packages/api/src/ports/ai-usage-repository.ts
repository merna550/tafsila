/** AI usage port: one row per AI call and the daily count the caps need (SRS §9, NFR-04). Written by the API role only. */

/** What kind of AI call a row records. */
export type AiUsageKind = "analyze" | "chat" | "explain";

/** One AI call to record. */
export interface AiUsageEntry {
  readonly userId: string;
  /** The design the call was about; ignored by the database when it is not the user's. */
  readonly designId?: string;
  readonly kind: AiUsageKind;
  readonly provider: string;
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  /** Estimated cost in US dollars (a price-list estimate, not an invoice). */
  readonly costUsd: number;
  readonly latencyMs: number;
}

/** Records and counts AI calls. */
export interface AiUsageRepository {
  /**
   * Records one call.
   *
   * @param entry - The call.
   */
  record(entry: AiUsageEntry): Promise<void>;
  /**
   * Counts the user's calls of one kind since 00:00 UTC of the day of `now` (caps count by UTC day).
   *
   * @param userId - The user.
   * @param kind - Kind of call.
   * @param now - Current time.
   * @returns The count.
   */
  countToday(userId: string, kind: AiUsageKind, now: Date): Promise<number>;
}
