"use client";
/** Hook that creates or updates a measurement set and refreshes what shows it. */
import {
  measurementSetSchema,
  type MeasurementSet,
  type SaveMeasurementSetInput,
  type UpdateMeasurementSetInput,
} from "@tafsila/schemas";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { measurementKeys } from "./query-keys";

/** Prefixes of the cached data a saved set changes: client lists (summary), a client's sets, the set itself. */
const AFFECTED_KEYS = [["clients"], ["measurement-sets"]] as const;

/**
 * Saves a set: POST when `setId` is missing, otherwise PUT.
 *
 * @param setId - Id of the set being edited, if any.
 * @returns The mutation; its argument is the body and its result the stored set.
 */
export function useSaveMeasurementSet(
  setId?: string,
): UseMutationResult<MeasurementSet, Error, SaveMeasurementSetInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveMeasurementSetInput) => {
      if (!setId) return apiRequest("/measurements", { method: "POST", body, schema: measurementSetSchema });
      const updateBody: UpdateMeasurementSetInput = {
        label: body.label,
        sizeLabel: body.sizeLabel,
        measurements: body.measurements,
      };
      return apiRequest(`/measurements/${setId}`, {
        method: "PUT",
        body: updateBody,
        schema: measurementSetSchema,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        ...AFFECTED_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        ...(setId ? [queryClient.invalidateQueries({ queryKey: measurementKeys.set(setId) })] : []),
      ]);
    },
  });
}
