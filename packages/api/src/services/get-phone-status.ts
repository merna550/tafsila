/** Use case: the caller's phone verification state, for the verify screen, the dashboard banner and settings. */
import type { PhoneStatusResponse } from "@tafsila/schemas";
import type { PhoneVerificationRepository } from "../ports/phone-verification-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Reads the caller's phone state.
 *
 * @param phones - Phone verification repository.
 * @param ctx - Verified caller.
 * @returns Whether the phone is verified, the number and trial eligibility.
 */
export async function getPhoneStatus(
  phones: PhoneVerificationRepository,
  ctx: AuthContext,
): Promise<PhoneStatusResponse> {
  const status = await phones.status(ctx);
  return { verified: status.verified, phone: status.phone, trialEligible: status.trialEligible };
}
