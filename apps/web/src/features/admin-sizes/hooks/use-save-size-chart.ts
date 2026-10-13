"use client";
/** Hook that saves the default size chart (PUT) and refreshes everything that shows it. */
import {
  updateSizeChartResponseSchema,
  type UpdateSizeChartInput,
  type UpdateSizeChartResponse,
} from "@tafsila/schemas";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { ADMIN_SIZE_CHART_KEY } from "./use-admin-size-chart";

/** Key of the chart that the measurement form reads (`measurements` feature; not imported to keep features apart). */
const MEMBER_CHART_KEY = ["size-charts", "default"] as const;

/**
 * Saves the chart. The new chart replaces the cached one so the grid shows it at once.
 *
 * @returns The mutation; its argument is the body and its result the saved chart with its warnings.
 */
export function useSaveSizeChart(): UseMutationResult<UpdateSizeChartResponse, Error, UpdateSizeChartInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateSizeChartInput) =>
      apiRequest("/admin/size-charts/default", {
        method: "PUT",
        body,
        schema: updateSizeChartResponseSchema,
      }),
    onSuccess: async (saved) => {
      queryClient.setQueryData(ADMIN_SIZE_CHART_KEY, saved);
      await queryClient.invalidateQueries({ queryKey: MEMBER_CHART_KEY });
    },
  });
}
