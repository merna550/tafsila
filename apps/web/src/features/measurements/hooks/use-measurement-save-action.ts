"use client";
/** Hook that saves the form: the request, a success toast and the failure handling shared by the app (ADR-030). */
import type { SaveMeasurementSetInput } from "@tafsila/schemas";
import { useToast } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { useApiErrorHandler } from "@/shared/error-display";
import { useSaveMeasurementSet } from "./use-save-measurement-set";

/** What the form needs to save. */
export interface MeasurementSaveAction {
  /** Saves the body; resolves after the toast and `onSaved`, or after the error was shown. */
  readonly save: (body: SaveMeasurementSetInput) => Promise<void>;
  /** True while the request runs. */
  readonly pending: boolean;
}

/**
 * Wires saving: POST for a new set, PUT when `setId` is given. Failures show a toast; the user stays on the form.
 *
 * @param setId - Id of the set being edited, if any.
 * @param onSaved - Runs after a successful save (goes back to the client profile).
 * @returns The save function and the pending flag.
 */
export function useMeasurementSaveAction(
  setId: string | undefined,
  onSaved: () => void,
): MeasurementSaveAction {
  const t = useTranslations("measurements.save");
  const { showToast } = useToast();
  const handleError = useApiErrorHandler();
  const mutation = useSaveMeasurementSet(setId);
  const save = useCallback(
    async (body: SaveMeasurementSetInput) => {
      try {
        await mutation.mutateAsync(body);
        showToast({ title: t("saved"), tone: "success" });
        onSaved();
      } catch (error) {
        handleError(error, "action");
      }
    },
    [handleError, mutation, onSaved, showToast, t],
  );
  return { save, pending: mutation.isPending };
}
