"use client";
/** Application hook of the sign-in screen: email and password, then on to `next` (or the dashboard). */
import { useRouter } from "@/shared/i18n";
import { signIn } from "@/shared/auth";
import { resolveNextPath } from "../model/next-path";
import { signInSchema, type SignInValues } from "../model/auth.schema";
import { useAuthForm, type AuthForm } from "./use-auth-form";

/**
 * Provides the sign-in form.
 *
 * @param next - Raw `next` query value; only same-site paths are followed.
 * @returns The form state.
 */
export function useSignIn(next: string | null): AuthForm<SignInValues> {
  const router = useRouter();
  return useAuthForm({
    schema: signInSchema,
    defaultValues: { email: "", password: "" },
    action: (client, values) => signIn(client, values),
    onSuccess: () => {
      router.replace(resolveNextPath(next));
      router.refresh();
    },
  });
}
