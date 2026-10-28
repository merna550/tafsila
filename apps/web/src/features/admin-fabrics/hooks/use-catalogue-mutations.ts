"use client";
/** Hooks that add, change and delete a fabric or a rule; each refreshes the admin lists and the cached recommendations when it succeeds. */
import {
  adminFabricRuleSchema,
  adminFabricSchema,
  type AdminFabric,
  type AdminFabricRule,
  type CreateFabricInput,
  type CreateFabricRuleInput,
  type UpdateFabricInput,
  type UpdateFabricRuleInput,
} from "@tafsila/schemas";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { z } from "zod";
import { fabricKeys } from "@/features/fabric";
import { apiRequest } from "@/shared/api";
import { ADMIN_FABRICS_KEY, ADMIN_RULES_KEY } from "./query-keys";

/**
 * Returns a function that marks one admin list and the recommendations of every version as stale.
 *
 * @param listKey - Key of the admin list that changed.
 * @returns The invalidation function.
 */
function useInvalidate(listKey: readonly string[]): () => Promise<void> {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: listKey });
    await queryClient.invalidateQueries({ queryKey: fabricKeys.all });
  };
}

/**
 * Adds a fabric.
 *
 * @returns The mutation; its result is the stored fabric.
 */
export function useCreateFabric(): UseMutationResult<AdminFabric, Error, CreateFabricInput> {
  const onSuccess = useInvalidate(ADMIN_FABRICS_KEY);
  return useMutation({
    mutationFn: (body: CreateFabricInput) =>
      apiRequest("/admin/fabrics", { method: "POST", body, schema: adminFabricSchema }),
    onSuccess,
  });
}

/**
 * Changes a fabric.
 *
 * @param id - Fabric id.
 * @returns The mutation; its result is the stored fabric.
 */
export function useUpdateFabric(id: string): UseMutationResult<AdminFabric, Error, UpdateFabricInput> {
  const onSuccess = useInvalidate(ADMIN_FABRICS_KEY);
  return useMutation({
    mutationFn: (body: UpdateFabricInput) =>
      apiRequest(`/admin/fabrics/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body,
        schema: adminFabricSchema,
      }),
    onSuccess,
  });
}

/**
 * Deletes a fabric (a hard delete; the audit row keeps the old value).
 *
 * @returns The mutation; its argument is the fabric id.
 */
export function useDeleteFabric(): UseMutationResult<undefined, Error, string> {
  const onSuccess = useInvalidate(ADMIN_FABRICS_KEY);
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/admin/fabrics/${encodeURIComponent(id)}`, { method: "DELETE", schema: z.undefined() }),
    onSuccess,
  });
}

/**
 * Adds a rule.
 *
 * @returns The mutation; its result is the stored rule.
 */
export function useCreateRule(): UseMutationResult<AdminFabricRule, Error, CreateFabricRuleInput> {
  const onSuccess = useInvalidate(ADMIN_RULES_KEY);
  return useMutation({
    mutationFn: (body: CreateFabricRuleInput) =>
      apiRequest("/admin/fabric-rules", { method: "POST", body, schema: adminFabricRuleSchema }),
    onSuccess,
  });
}

/**
 * Changes a rule.
 *
 * @param id - Rule id.
 * @returns The mutation; its result is the stored rule.
 */
export function useUpdateRule(id: string): UseMutationResult<AdminFabricRule, Error, UpdateFabricRuleInput> {
  const onSuccess = useInvalidate(ADMIN_RULES_KEY);
  return useMutation({
    mutationFn: (body: UpdateFabricRuleInput) =>
      apiRequest(`/admin/fabric-rules/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body,
        schema: adminFabricRuleSchema,
      }),
    onSuccess,
  });
}

/**
 * Deletes a rule.
 *
 * @returns The mutation; its argument is the rule id.
 */
export function useDeleteRule(): UseMutationResult<undefined, Error, string> {
  const onSuccess = useInvalidate(ADMIN_RULES_KEY);
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/admin/fabric-rules/${encodeURIComponent(id)}`, {
        method: "DELETE",
        schema: z.undefined(),
      }),
    onSuccess,
  });
}
