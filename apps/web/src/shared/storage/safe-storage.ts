/** Guarded access to `localStorage`: it can be missing or throw (private window, blocked site data), so nothing here throws. */

/**
 * Reads and parses a JSON value.
 *
 * @param key - Storage key.
 * @returns The parsed value, or null when missing, unreadable or storage is unavailable.
 */
export function readJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

/**
 * Writes a JSON value.
 *
 * @param key - Storage key.
 * @param value - Any JSON-serialisable value.
 * @returns True when stored, false when storage refused.
 */
export function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes a key.
 *
 * @param key - Storage key.
 */
export function remove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}
