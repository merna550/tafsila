"use client";
/** Hook that saves the chart: the request, a success toast and the shared failure handling (ADR-030). */
import type { UpdateSizeChartInput } from "@tafsila/schemas";
import { useToast } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { useApiErrorHandler } from "@/shared/error-display";
import { useSaveSizeChart } from "./use-save-size-chart";

/** What the screen needs to save. */
export interface SizeChartSaveAction {
  /** Saves the body; resolves to true after a success, false after the error was shown. */
  readonly save: (body: UpdateSizeChartInput) => Promise<boolean>;
  /** True while the request runs. */
  readonly pending: boolean;
}

/**
 * Wires saving with a toast. Failures show a toast and the edits stay on screen.
 *
 * @returns The save function and the pending flag.
 */
export function useSizeChartSaveAction(): SizeChartSaveAction {
  const t = useTranslations("admin.sizes");
  const { showToast } = useToast();
  const handleError = useApiErrorHandler();
  const mutation = useSaveSizeChart();
  const save = useCallback(
    async (body: UpdateSizeChartInput) => {
      try {
        await mutation.mutateAsync(body);
        showToast({ title: t("saved"), tone: "success" });
        return true;
      } catch (error) {
        handleError(error, "action");
        return false;
      }
    },
    [handleError, mutation, showToast, t],
  );
  return { save, pending: mutation.isPending };
}
