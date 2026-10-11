"use client";
/** Application hook of the sign-up screen: creates the account and remembers where the confirmation mail went. */
import { useState } from "react";
import { signUp } from "@/shared/auth";
import { track } from "@/shared/analytics";
import { signUpSchema, type SignUpValues } from "../model/auth.schema";
import { useAuthForm, type AuthForm } from "./use-auth-form";

/** The sign-up form plus the address the confirmation mail was sent to. */
export interface UseSignUp extends AuthForm<SignUpValues> {
  /** Address of the sent mail; null until the sign-up succeeded. */
  readonly sentTo: string | null;
}

/**
 * Provides the sign-up form. A sign-up with an address that already exists looks the same as a new one
 * (no account enumeration, decision 25-9), so the notice never says whether the address was known.
 *
 * @returns The form state and the "check your email" address.
 */
export function useSignUp(): UseSignUp {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const auth = useAuthForm({
    schema: signUpSchema,
    defaultValues: { email: "", password: "", confirmPassword: "" },
    action: (client, { email, password }) =>
      signUp(client, { email, password }, `${window.location.origin}/auth/confirm`),
    onSuccess: ({ email }) => setSentTo(email),
    onFirstSubmit: () => track("signup_started", { source: "sign_up_page", method: "email" }),
  });
  return { ...auth, sentTo };
}
