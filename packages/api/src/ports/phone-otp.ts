/** Phone OTP port: sends a one-time code to a phone and checks it. The first adapter is Supabase Auth; WhatsApp or another channel is a new adapter. */

/** The signed-in account asking for a code. */
export interface OtpCaller {
  /** The account's id. */
  readonly userId: string;
  /** The caller's own access token (the adapter may need it to act as the user). */
  readonly accessToken: string;
}

/** Sends and verifies codes. Adapters throw AppError (PHONE_CODE_INVALID, PHONE_ALREADY_USED, PHONE_TOO_MANY_ATTEMPTS, PHONE_SEND_FAILED). */
export interface PhoneOtp {
  /**
   * Sends a code to the number.
   *
   * @param caller - The account the number will be attached to.
   * @param e164 - Normalised number.
   */
  send(caller: OtpCaller, e164: string): Promise<void>;
  /**
   * Checks a code.
   *
   * @param e164 - Normalised number the code was sent to.
   * @param code - The six digits.
   * @returns The id of the account the provider attached the number to (the service compares it with the caller).
   */
  verify(e164: string, code: string): Promise<{ userId: string }>;
}
