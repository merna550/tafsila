/** Maps the PHONE_* error codes of the API to the place and the text key the verify-phone screen shows (ADR-030). */

/** Which of the two steps of the card is open. */
export type VerifyStep = "phone" | "code";

/** Where an error is shown on the screen. */
export type PhoneErrorTarget = "phone" | "code" | "done";

/** What the screen does for one error code. */
export interface PhoneErrorRule {
  /** `phone`: under the number field; `code`: under the code boxes; `done`: nothing to show, the phone is verified. */
  readonly target: PhoneErrorTarget;
  /** Key of `phoneVerification.errors`; also the code itself, so the texts sit next to `docs/errors.md`. */
  readonly messageKey: PhoneErrorCode;
}

/** Codes of `phoneVerification.errors` in `messages/` (the API's PHONE_* codes). */
export type PhoneErrorCode =
  | "PHONE_INVALID"
  | "PHONE_TEST_ONLY"
  | "PHONE_ALREADY_USED"
  | "PHONE_ALREADY_VERIFIED"
  | "PHONE_CODE_INVALID"
  | "PHONE_RESEND_TOO_SOON"
  | "PHONE_TOO_MANY_ATTEMPTS"
  | "PHONE_SEND_FAILED";

/** Which step each code belongs to. */
const RULES: Readonly<Record<PhoneErrorCode, PhoneErrorTarget>> = {
  PHONE_INVALID: "phone",
  PHONE_TEST_ONLY: "phone",
  PHONE_ALREADY_USED: "phone",
  PHONE_ALREADY_VERIFIED: "done",
  PHONE_CODE_INVALID: "code",
  PHONE_RESEND_TOO_SOON: "phone",
  PHONE_TOO_MANY_ATTEMPTS: "phone",
  PHONE_SEND_FAILED: "phone",
};

/**
 * Tells whether a code is one of the PHONE_* codes the screen has a text for.
 *
 * @param code - Code of an ApiError.
 * @returns True for a known phone code.
 */
export function isPhoneErrorCode(code: string): code is PhoneErrorCode {
  return Object.hasOwn(RULES, code);
}

/**
 * Chooses where the error is shown. Codes that arrive while the code step is open (too many wrong codes, a slow
 * resend) belong under the code boxes, so the step is part of the decision.
 *
 * @param code - A known PHONE_* code.
 * @param step - The step the person was on when the call failed.
 * @returns The place and the message key.
 * @example
 * ruleFor("PHONE_CODE_INVALID", "code"); // { target: "code", messageKey: "PHONE_CODE_INVALID" }
 */
export function ruleFor(code: PhoneErrorCode, step: VerifyStep): PhoneErrorRule {
  const target = RULES[code];
  return { target: target === "phone" && step === "code" ? "code" : target, messageKey: code };
}
