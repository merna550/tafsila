import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema } from "./auth.schema";

/**
 * Returns the first error message of a failed parse.
 *
 * @param result - A Zod safe-parse result.
 * @returns The message, or undefined when the parse succeeded.
 */
function firstMessage(result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}): string | undefined {
  return result.success ? undefined : result.error?.issues[0]?.message;
}

describe("signInSchema", () => {
  it("accepts a valid email and any non-empty password", () => {
    expect(signInSchema.safeParse({ email: "mona@example.com", password: "x" }).success).toBe(true);
  });

  it("asks for the email and the password", () => {
    expect(firstMessage(signInSchema.safeParse({ email: "", password: "x" }))).toBe("emailRequired");
    expect(firstMessage(signInSchema.safeParse({ email: "mona@example.com", password: "" }))).toBe(
      "passwordRequired",
    );
  });

  it("rejects an invalid email, including Arabic-Indic digits", () => {
    expect(firstMessage(signInSchema.safeParse({ email: "mona", password: "x" }))).toBe("emailInvalid");
    expect(firstMessage(signInSchema.safeParse({ email: "mona٣@example.com", password: "x" }))).toBe(
      "emailInvalid",
    );
  });
});

describe("signUpSchema", () => {
  const valid = { email: "mona@example.com", password: "password1", confirmPassword: "password1" };

  it("accepts a valid form and trims the email", () => {
    expect(signUpSchema.parse({ ...valid, email: "  mona@example.com " }).email).toBe("mona@example.com");
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(
      firstMessage(signUpSchema.safeParse({ ...valid, password: "short", confirmPassword: "short" })),
    ).toBe("passwordShort");
  });

  it("accepts exactly 8 characters and long passphrases", () => {
    expect(
      signUpSchema.safeParse({ ...valid, password: "12345678", confirmPassword: "12345678" }).success,
    ).toBe(true);
    const long = "a long passphrase with spaces 123";
    expect(signUpSchema.safeParse({ ...valid, password: long, confirmPassword: long }).success).toBe(true);
  });

  it("puts the mismatch on the confirmation field", () => {
    const result = signUpSchema.safeParse({ ...valid, confirmPassword: "different1" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({ path: ["confirmPassword"], message: "passwordMismatch" });
  });
});

describe("forgotPasswordSchema and resetPasswordSchema", () => {
  it("needs a valid email to send the link", () => {
    expect(forgotPasswordSchema.safeParse({ email: "mona@example.com" }).success).toBe(true);
    expect(firstMessage(forgotPasswordSchema.safeParse({ email: "x" }))).toBe("emailInvalid");
  });

  it("needs two matching passwords of 8 characters or more", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "password1", confirmPassword: "password1" }).success,
    ).toBe(true);
    expect(firstMessage(resetPasswordSchema.safeParse({ password: "short", confirmPassword: "short" }))).toBe(
      "passwordShort",
    );
    expect(
      firstMessage(resetPasswordSchema.safeParse({ password: "password1", confirmPassword: "password2" })),
    ).toBe("passwordMismatch");
  });
});
