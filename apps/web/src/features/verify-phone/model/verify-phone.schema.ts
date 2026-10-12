/** Form schemas of the verify-phone screen. Error messages are keys of `phoneVerification.validation` in `messages/`. */
import { normalizeEgyptianMobile } from "@tafsila/utils";
import { z } from "zod";

/** Keys of `phoneVerification.validation` that the schemas use as error messages. */
export type PhoneValidationKey = "phoneRequired" | "phoneInvalid" | "codeIncomplete";

/** Number of digits in the verification code (the design shows six boxes). */
export const CODE_LENGTH = 6;

/**
 * The phone field: whatever the person typed, checked with the same normaliser the API uses, and turned into the
 * E.164 number. The API normalises again, so this check is a convenience, never the only gate.
 */
export const phoneFieldSchema = z
  .string()
  .trim()
  .min(1, "phoneRequired")
  .transform((input, ctx) => {
    const e164 = normalizeEgyptianMobile(input);
    if (!e164) ctx.addIssue({ code: "custom", message: "phoneInvalid" });
    return e164 ?? z.NEVER;
  });

/** The number step: one field. */
export const phoneFormSchema = z.object({ phone: phoneFieldSchema });

/** The code step: exactly six ASCII digits (the code input already converts Arabic-Indic digits). */
export const codeSchema = z.string().regex(new RegExp(`^\\d{${CODE_LENGTH}}$`), "codeIncomplete");

/** What the number field holds while typing. */
export type PhoneFormInput = z.input<typeof phoneFormSchema>;
/** The validated number step: the phone in E.164. */
export type PhoneFormValues = z.output<typeof phoneFormSchema>;
