/** Storage buckets that can hold a user's files. A test keeps this list equal to supabase/config.toml, so a new bucket cannot be forgotten by account deletion. */

/** Bucket names; every object lives under `<userId>/` inside its bucket. */
export const STORAGE_BUCKETS: readonly string[] = ["design-photos"];
