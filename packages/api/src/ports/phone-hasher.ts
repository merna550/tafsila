/** Phone hasher port: keyed hashes of phones and IPs, so the database never stores either in clear text. */

/** Produces deterministic keyed hashes. */
export interface PhoneHasher {
  /** Hash of a normalised phone number (identifies a number across accounts and across deleted accounts). */
  phone(e164: string): Uint8Array;
  /** Hash of a client IP address (domain-separated from phones), kept 24 hours for rate limits. */
  ip(ip: string): Uint8Array;
}
