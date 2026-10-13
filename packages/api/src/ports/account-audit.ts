/** Account audit port: records that an account was deleted, without saying whose. */

/** Writes the deletion audit row. */
export interface AccountAudit {
  /**
   * Adds one anonymous `account.deleted` row (no user id, no email, no name; NFR-05).
   *
   * @throws {Error} When the write fails.
   */
  recordDeleted(): Promise<void>;
}
