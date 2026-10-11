/** Form schemas of the auth screens. Error messages are keys of `auth.validation` in `messages/`, translated by the form. */
import { z } from "zod";

/** Keys of `auth.validation` in `messages/` that the schemas use as error messages. */
export type ValidationKey =
  "emailRequired" | "emailInvalid" | "passwordRequired" | "passwordShort" | "passwordMismatch";

/** Minimum password length (decision 25-7: at least 8 characters, no other rule). */
export const MIN_PASSWORD_LENGTH = 8;

/** Email field: required, then a valid address (Arabic-Indic digits and other non-ASCII lookalikes are rejected). */
const emailField = z.string().trim().min(1, "emailRequired").pipe(z.email("emailInvalid"));

/** Password field when choosing a new password. */
const newPasswordField = z.string().min(MIN_PASSWORD_LENGTH, "passwordShort");

/**
 * Adds the "both passwords match" rule to an object schema that has `password` and `confirmPassword`.
 *
 * @param schema - Object schema with the two fields.
 * @returns The schema with the match check on `confirmPassword`.
 */
function withMatchingPasswords<V extends { password: string; confirmPassword: string }>(
  schema: z.ZodType<V, Record<string, unknown>>,
): z.ZodType<V, Record<string, unknown>> {
  return schema.refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordMismatch",
  });
}

/** Sign-in form. */
export const signInSchema = z.object({ email: emailField, password: z.string().min(1, "passwordRequired") });

/** Sign-up form. */
export const signUpSchema = withMatchingPasswords(
  z.object({ email: emailField, password: newPasswordField, confirmPassword: z.string() }),
);

/** Forgot-password form. */
export const forgotPasswordSchema = z.object({ email: emailField });

/** Reset-password form. */
export const resetPasswordSchema = withMatchingPasswords(
  z.object({ password: newPasswordField, confirmPassword: z.string() }),
);

/** Values of the sign-in form. */
export type SignInValues = z.output<typeof signInSchema>;
/** Values of the sign-up form. */
export type SignUpValues = z.output<typeof signUpSchema>;
/** Values of the forgot-password form. */
export type ForgotPasswordValues = z.output<typeof forgotPasswordSchema>;
/** Values of the reset-password form. */
export type ResetPasswordValues = z.output<typeof resetPasswordSchema>;
