"use client";
/** Hook that runs the start sequence and tells the photo list what happens; a retry reuses the design made by the first try. */
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { designKeys } from "@/entities/design/design-keys";
import { useApiErrorHandler } from "@/shared/error-display";
import { useRouter } from "@/shared/i18n";
import { designCategoryOf, hintOf, type CategoryChoice } from "../model/category-choice";
import type { PhotoSlots } from "./use-photo-slots";
import { startAnalysis, type PhotoUpdate } from "./start-analysis";

/** What the hook gives the screen. */
export interface StartAnalysisControl {
  /** True while the sequence runs. */
  readonly running: boolean;
  /** Runs the sequence for the chosen category and moves to the analysing screen on success. */
  readonly start: (choice: CategoryChoice) => Promise<void>;
}

/** Message key shown on a photo whose upload failed. */
const UPLOAD_FAILED_KEY = "uploadFailed";

/**
 * Starts the analysis of the photos in `slots`.
 *
 * @param slots - The photo list.
 * @returns The running flag and the start action.
 */
export function useStartAnalysis(slots: PhotoSlots): StartAnalysisControl {
  const router = useRouter();
  const queryClient = useQueryClient();
  const handleError = useApiErrorHandler();
  const designId = useRef<string | undefined>(undefined);
  const [running, setRunning] = useState(false);
  const { dispatch, pending } = slots;

  /** Mirrors one upload update into the photo list. */
  const onPhoto = useCallback(
    (id: string, update: PhotoUpdate): void => {
      if (update.kind === "progress") dispatch({ type: "progress", id, progress: update.fraction });
      else if (update.kind === "uploading") dispatch({ type: "status", id, status: "uploading" });
      else if (update.kind === "uploaded") dispatch({ type: "status", id, status: "uploaded" });
      else dispatch({ type: "status", id, status: "ready", errorKey: UPLOAD_FAILED_KEY });
    },
    [dispatch],
  );

  const start = useCallback(
    async (choice: CategoryChoice): Promise<void> => {
      setRunning(true);
      try {
        const id = await startAnalysis({
          existingDesignId: designId.current,
          category: designCategoryOf(choice),
          hint: hintOf(choice),
          photos: pending(),
          onDesign: (created) => {
            designId.current = created;
          },
          onPhoto,
        });
        await queryClient.invalidateQueries({ queryKey: designKeys.all });
        router.push(`/designs/${id}/analysing`);
      } catch (error) {
        handleError(error, "action");
        setRunning(false);
      }
    },
    [handleError, onPhoto, pending, queryClient, router],
  );
  return { running, start };
}
