"use client";
/** Application hook of the forgot-password screen: sends the reset mail and remembers the address. */
import { useState } from "react";
import { requestReset } from "@/shared/auth";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../model/auth.schema";
import { useAuthForm, type AuthForm } from "./use-auth-form";

/** The form plus the address the reset mail was sent to. */
export interface UseForgotPassword extends AuthForm<ForgotPasswordValues> {
  /** Address of the sent mail; null until the request succeeded. */
  readonly sentTo: string | null;
}

/**
 * Provides the forgot-password form. The notice is the same whether or not the address has an account.
 *
 * @returns The form state and the "check your email" address.
 */
export function useForgotPassword(): UseForgotPassword {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const auth = useAuthForm({
    schema: forgotPasswordSchema,
    defaultValues: { email: "" },
    action: (client, { email }) => requestReset(client, email, `${window.location.origin}/auth/confirm`),
    onSuccess: ({ email }) => setSentTo(email),
  });
  return { ...auth, sentTo };
}
