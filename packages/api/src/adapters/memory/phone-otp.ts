/** In-memory PhoneOtp for tests and local runs without GoTrue: test numbers only, the code is always 123456. */
import { AppError } from "../../domain/errors";
import type { PhoneOtp } from "../../ports/phone-otp";

/** The code every memory number accepts. */
export const MEMORY_OTP_CODE = "123456";

/** A memory PhoneOtp plus switches tests use. */
export interface MemoryPhoneOtp extends PhoneOtp {
  /** Numbers a code was sent to, in order. */
  readonly sent: string[];
  /** Makes the next send fail with PHONE_SEND_FAILED. */
  failNextSend(): void;
}

/**
 * Creates the memory PhoneOtp. The last account that asked for a number owns its pending code, like GoTrue's phone change.
 *
 * @returns A MemoryPhoneOtp.
 */
export function createMemoryPhoneOtp(): MemoryPhoneOtp {
  const pending = new Map<string, string>();
  const sent: string[] = [];
  let failing = false;
  return {
    sent,
    failNextSend() {
      failing = true;
    },
    send(caller, e164) {
      if (failing) {
        failing = false;
        return Promise.reject(new AppError("PHONE_SEND_FAILED"));
      }
      pending.set(e164, caller.userId);
      sent.push(e164);
      return Promise.resolve();
    },
    verify(e164, code) {
      const userId = pending.get(e164);
      if (!userId || code !== MEMORY_OTP_CODE) return Promise.reject(new AppError("PHONE_CODE_INVALID"));
      return Promise.resolve({ userId });
    },
  };
}
