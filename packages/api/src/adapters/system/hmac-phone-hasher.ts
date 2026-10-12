/** Keyed hashes of phones and IPs with HMAC-SHA256 (decision 26-phone-otp-trial, 3): a leaked table cannot be reversed without the secret. */
import { createHmac } from "node:crypto";
import type { PhoneHasher } from "../../ports/phone-hasher";

/** Prefix that keeps IP hashes from ever equalling a phone hash. */
const IP_DOMAIN = "ip:";

/**
 * Creates the hasher.
 *
 * @param secret - PHONE_HASH_SECRET (min 32 characters, one per environment).
 * @returns A PhoneHasher.
 */
export function createHmacPhoneHasher(secret: string): PhoneHasher {
  /**
   * Keyed hash of a text.
   *
   * @param text - Text to hash.
   * @returns The 32-byte HMAC-SHA256.
   */
  function hmac(text: string): Uint8Array {
    return new Uint8Array(createHmac("sha256", secret).update(text).digest());
  }
  return { phone: (e164) => hmac(e164), ip: (ip) => hmac(`${IP_DOMAIN}${ip}`) };
}

/**
 * Creates a hasher that fails on use, for environments without PHONE_HASH_SECRET (reported as INTERNAL_ERROR).
 *
 * @returns A PhoneHasher whose every call throws.
 */
export function createRejectingPhoneHasher(): PhoneHasher {
  /**
   * Always throws.
   *
   * @throws {Error} PHONE_HASH_SECRET is not configured.
   */
  function fail(): never {
    throw new Error("PHONE_HASH_SECRET is not configured");
  }
  return { phone: fail, ip: fail };
}
