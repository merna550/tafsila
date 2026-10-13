"use client";
/** Mutation that changes the profile name and/or language (PATCH /api/profile) and refreshes the cached profile. */
import { profileSchema, type Profile, type UpdateProfileInput } from "@tafsila/schemas";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { profileKeys } from "./query-keys";

/**
 * Prepares the profile update.
 *
 * @returns The mutation; its result is the stored profile.
 */
export function useUpdateProfile(): UseMutationResult<Profile, Error, UpdateProfileInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: UpdateProfileInput) =>
      apiRequest("/profile", { method: "PATCH", body: patch, schema: profileSchema }),
    onSuccess: (profile) => queryClient.setQueryData(profileKeys.all, profile),
  });
}
