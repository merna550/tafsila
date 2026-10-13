"use client";
/** Hook behind the name field: React Hook Form + Zod, an explicit save, field errors under the field, a success toast. */
import { zodResolver } from "@hookform/resolvers/zod";
import type { Profile } from "@tafsila/schemas";
import { useToast } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { useApiErrorHandler } from "@/shared/error-display";
import { isNameChanged, profileFormSchema, type ProfileFormValues } from "../model/profile-form.schema";
import { useUpdateProfile } from "./use-update-profile";

/** What the account card needs. */
export interface ProfileForm {
  /** The React Hook Form instance. */
  readonly form: UseFormReturn<ProfileFormValues>;
  /** Submit handler for the `<form onSubmit>`. */
  readonly onSubmit: (event?: React.BaseSyntheticEvent) => void;
  /** True while saving. */
  readonly pending: boolean;
  /** True when the field differs from the saved name. */
  readonly changed: boolean;
}

/**
 * Wires the name field to the profile update; API field errors go under the field, other failures to the shared toast.
 *
 * @param profile - The loaded profile.
 * @returns The form, its submit handler and the flags.
 */
export function useProfileForm(profile: Profile): ProfileForm {
  const t = useTranslations("settings.account");
  const { showToast } = useToast();
  const handleError = useApiErrorHandler();
  const mutation = useUpdateProfile();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: profile.name ?? "" },
    mode: "onSubmit",
  });
  const typed = useWatch({ control: form.control, name: "name" });
  const submit = useCallback(
    async (values: ProfileFormValues) => {
      try {
        const saved = await mutation.mutateAsync({ name: values.name });
        form.reset({ name: saved.name ?? "" });
        showToast({ title: t("saved"), tone: "success" });
      } catch (error) {
        const route = handleError(error, "action");
        const message = route.fieldErrors.name;
        if (message) form.setError("name", { message });
      }
    },
    [form, handleError, mutation, showToast, t],
  );
  const handleSubmit = form.handleSubmit(submit);
  return {
    form,
    onSubmit: (event) => void handleSubmit(event),
    pending: mutation.isPending,
    changed: isNameChanged(typed, profile.name),
  };
}
