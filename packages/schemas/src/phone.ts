/** Contracts of /api/phone (FR-AUTH-02, FR-AUTH-03): phone verification by one-time code. Examples use test numbers only. */
import { z } from "zod";

/** Longest phone text and code text accepted before normalising (pasted text can carry spaces and marks). */
const MAX_PHONE_INPUT = 40;
const MAX_CODE_INPUT = 12;

/** What the person typed; the API normalises it with `normalizeEgyptianMobile` and answers PHONE_INVALID when it is not a mobile. */
const phoneInputSchema = z.string().trim().min(1).max(MAX_PHONE_INPUT).meta({ example: "010 0000 0005" });

/** Body of POST /api/phone/code. */
export const sendPhoneCodeBodySchema = z.object({ phone: phoneInputSchema }).strict();

/** Parsed send-code body. */
export type SendPhoneCodeBody = z.infer<typeof sendPhoneCodeBodySchema>;

/** Response of POST /api/phone/code. */
export const sendPhoneCodeResponseSchema = z.object({
  phone: z.string().meta({ example: "+201000000005" }),
  resendAfterSeconds: z.number().int().positive().meta({ example: 60 }),
});

/** Parsed send-code response. */
export type SendPhoneCodeResponse = z.infer<typeof sendPhoneCodeResponseSchema>;

/** Body of POST /api/phone/verify; the code is checked after Arabic digits are converted. */
export const verifyPhoneBodySchema = z
  .object({
    phone: phoneInputSchema,
    code: z.string().trim().min(1).max(MAX_CODE_INPUT).meta({ example: "123456" }),
  })
  .strict();

/** Parsed verify body. */
export type VerifyPhoneBody = z.infer<typeof verifyPhoneBodySchema>;

/** Response of POST /api/phone/verify. */
export const verifyPhoneResponseSchema = z.object({
  verifiedAt: z.iso.datetime().meta({ example: "2026-10-12T10:00:00.000Z" }),
  trialEligible: z.boolean(),
});

/** Parsed verify response. */
export type VerifyPhoneResponse = z.infer<typeof verifyPhoneResponseSchema>;

/** Response of GET /api/phone. */
export const phoneStatusResponseSchema = z.object({
  verified: z.boolean(),
  phone: z.string().nullable().meta({ example: "+201000000005" }),
  trialEligible: z.boolean(),
});

/** Parsed phone status. */
export type PhoneStatusResponse = z.infer<typeof phoneStatusResponseSchema>;
