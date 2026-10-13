/** Repositories used when DATABASE_URL is not configured: every call fails, so the API never falls back to memory silently. */
import type { ClientRepository } from "../../ports/client-repository";
import type { MeasurementSetRepository } from "../../ports/measurement-set-repository";
import type { SizeChartRepository } from "../../ports/size-chart-repository";
import type { PhoneVerificationRepository } from "../../ports/phone-verification-repository";
import type { TrialEligibility } from "../../ports/trial-eligibility";

/** The repositories and ports that need the database. */
export interface Repositories {
  readonly clients: ClientRepository;
  readonly measurementSets: MeasurementSetRepository;
  readonly sizeCharts: SizeChartRepository;
  readonly phoneVerification: PhoneVerificationRepository;
  readonly trialEligibility: TrialEligibility;
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
    sizeCharts: { getDefault: failing() },
    phoneVerification: { status: failing(), attempt: failing(), confirm: failing() },
    trialEligibility: { isEligible: failing() },
  };
}
