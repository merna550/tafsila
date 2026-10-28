/** Repositories used when DATABASE_URL is not configured: every call fails, so the API never falls back to memory silently. */
import type { AdminRepository } from "../../ports/admin-repository";
import type { AccountAudit } from "../../ports/account-audit";
import type { ClientRepository } from "../../ports/client-repository";
import type { DesignRepository } from "../../ports/design-repository";
import type { PatternVersionRepository } from "../../ports/pattern-version-repository";
import type { MeasurementSetRepository } from "../../ports/measurement-set-repository";
import type { FabricCalcRepository } from "../../ports/fabric-calc-repository";
import type { FabricRepository, FabricRuleRepository } from "../../ports/fabric-repository";
import type { SizeChartRepository } from "../../ports/size-chart-repository";
import type { ProfileRepository } from "../../ports/profile-repository";
import type { PhoneVerificationRepository } from "../../ports/phone-verification-repository";
import type { TrialEligibility } from "../../ports/trial-eligibility";

/** The repositories and ports that need the database. */
export interface Repositories {
  readonly clients: ClientRepository;
  readonly designs: DesignRepository;
  readonly versions: PatternVersionRepository;
  readonly measurementSets: MeasurementSetRepository;
  readonly sizeCharts: SizeChartRepository;
  readonly fabrics: FabricRepository;
  readonly fabricRules: FabricRuleRepository;
  readonly fabricCalcs: FabricCalcRepository;
  readonly phoneVerification: PhoneVerificationRepository;
  readonly trialEligibility: TrialEligibility;
  readonly profiles: ProfileRepository;
  readonly accountAudit: AccountAudit;
  readonly admin: AdminRepository;
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
    designs: { create: failing(), list: failing(), get: failing(), rename: failing(), remove: failing() },
    versions: { appendVersion: failing(), list: failing(), get: failing() },
    measurementSets: {
      create: failing(),
      list: failing(),
      get: failing(),
      update: failing(),
      remove: failing(),
    },
    sizeCharts: { getDefault: failing(), getDefaultRecord: failing(), replaceDefault: failing() },
    fabrics: { list: failing(), create: failing(), update: failing(), remove: failing() },
    fabricRules: { list: failing(), create: failing(), update: failing(), remove: failing() },
    fabricCalcs: { save: failing(), latest: failing() },
    phoneVerification: { status: failing(), attempt: failing(), confirm: failing() },
    trialEligibility: { isEligible: failing() },
    profiles: { get: failing(), update: failing() },
    accountAudit: { recordDeleted: failing() },
    admin: { stats: failing(), list: failing(), get: failing() },
  };
}
