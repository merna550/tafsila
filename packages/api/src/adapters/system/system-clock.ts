/** System clock adapter: the real Clock used outside tests. */
import type { Clock } from "../../ports/clock";

/**
 * Creates a Clock backed by the machine time.
 *
 * @returns A Clock whose now() is the current system time.
 */
export function createSystemClock(): Clock {
  return { now: () => new Date() };
}
