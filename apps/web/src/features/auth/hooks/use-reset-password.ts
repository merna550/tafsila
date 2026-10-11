"use client";
/** Application hook of the reset-password screen: saves the new password for the recovery session. */
import { useToast } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/shared/i18n";
import { updatePassword } from "@/shared/auth";
import { resetPasswordSchema, type ResetPasswordValues } from "../model/auth.schema";
import { useAuthForm, type AuthForm } from "./use-auth-form";

/**
 * Provides the reset-password form; on success a toast confirms and the user lands on the dashboard (already signed in).
 *
 * @returns The form state.
 */
export function useResetPassword(): AuthForm<ResetPasswordValues> {
  const router = useRouter();
  const { showToast } = useToast();
  const t = useTranslations("auth.reset");
  return useAuthForm({
    schema: resetPasswordSchema,
    defaultValues: { password: "", confirmPassword: "" },
    action: (client, { password }) => updatePassword(client, password),
    onSuccess: () => {
      showToast({ title: t("done"), tone: "success" });
      router.replace("/dashboard");
      router.refresh();
    },
  });
}
