/** Repositories used when DATABASE_URL is not configured: every call fails, so the API never falls back to memory silently. */
import type { ClientRepository } from "../../ports/client-repository";
import type { MeasurementSetRepository } from "../../ports/measurement-set-repository";

/** Both repositories. */
export interface Repositories {
  readonly clients: ClientRepository;
  readonly measurementSets: MeasurementSetRepository;
}

/**
 * Creates a function that always rejects with a configuration error (reported as INTERNAL_ERROR).
 *
 * @returns A rejecting function.
 */
function failing(): () => Promise<never> {
  return () => Promise.reject(new Error("DATABASE_URL is not configured"));
}

/**
 * Creates repositories whose every method rejects.
 *
 * @returns Rejecting client and measurement set repositories.
 */
export function createRejectingRepositories(): Repositories {
  return {
    clients: {
      create: failing(),
      list: failing(),
      count: failing(),
      get: failing(),
      update: failing(),
      remove: failing(),
    },
    measurementSets: {
      create: failing(),
      list: failing(),
      get: failing(),
      update: failing(),
      remove: failing(),
    },
  };
}
