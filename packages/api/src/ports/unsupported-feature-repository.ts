/** Unsupported feature port: records garment features the analysis saw but the engine cannot draw (FR-DES-07). Written by the API role only. */

/** Records unsupported features for product research. */
export interface UnsupportedFeatureRepository {
  /**
   * Records each distinct text once for the design; a text already recorded for it is skipped.
   *
   * @param userId - The design's owner.
   * @param designId - The design; ignored by the database when it is not the user's.
   * @param texts - Feature descriptions (English).
   * @returns How many new rows were stored.
   */
  recordMany(userId: string, designId: string, texts: readonly string[]): Promise<number>;
}
