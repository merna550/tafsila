"use client";
/** Hooks that read the signed-in user's profile (GET /api/profile) and phone status (GET /api/phone). */
import { phoneStatusResponseSchema, profileSchema } from "@tafsila/schemas";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { PhoneStatusResponse, Profile } from "@tafsila/schemas";
import { apiRequest } from "@/shared/api";
import { profileKeys } from "./query-keys";

/**
 * Loads the profile (name, language, email).
 *
 * @returns The query.
 */
export function useProfile(): UseQueryResult<Profile> {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: ({ signal }) => apiRequest("/profile", { schema: profileSchema, signal }),
  });
}

/**
 * Loads the phone status for the read-only phone row.
 *
 * @returns The query.
 */
export function usePhone(): UseQueryResult<PhoneStatusResponse> {
  return useQuery({
    queryKey: profileKeys.phone,
    queryFn: ({ signal }) => apiRequest("/phone", { schema: phoneStatusResponseSchema, signal }),
  });
}
