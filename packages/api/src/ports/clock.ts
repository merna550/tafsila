/** Clock port: services ask for the time through this interface so tests can control it. */

/** Source of the current time. */
export interface Clock {
  /** Returns the current instant. */
  now(): Date;
}
