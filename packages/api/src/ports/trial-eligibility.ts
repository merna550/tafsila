/** Trial eligibility port: M7 asks whether an account may receive its free trial (verified phone, trial not granted yet). */

/** Answers the eligibility question. */
export interface TrialEligibility {
  /** True when the account's phone is verified, its trial row belongs to it and the trial was not granted. */
  isEligible(userId: string): Promise<boolean>;
}
