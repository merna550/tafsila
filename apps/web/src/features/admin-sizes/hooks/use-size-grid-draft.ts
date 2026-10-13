"use client";
/** Hook that holds the unsaved edits of the grid on top of the saved chart. */
import type { SizeChart } from "@tafsila/schemas";
import { useCallback, useMemo, useState } from "react";
import { useLeaveWarning } from "@/shared/hooks/use-leave-warning";
import type { MeasurementField } from "@/features/measurements/model";
import { chartToTexts, judgeGrid, setCell, type GridTexts, type GridVerdict } from "../model/size-grid";
import type { IssueLocale } from "../model/size-validation";

/** What the screen reads and calls. */
export interface SizeGridDraft {
  /** Texts shown in the cells (saved values with the edits on top). */
  readonly texts: GridTexts;
  /** The judgement of the grid. */
  readonly verdict: GridVerdict;
  /** Changes one cell. */
  readonly edit: (size: string, field: MeasurementField, value: string) => void;
  /** Throws the edits away. */
  readonly discard: () => void;
}

/**
 * Keeps the edits until they are saved or discarded; a new saved chart (after saving) clears them.
 * While edits exist the browser asks before the page is closed.
 *
 * @param saved - The saved chart in millimetres.
 * @param locale - Language of the engine messages.
 * @returns The texts, the verdict and the two actions.
 */
export function useSizeGridDraft(saved: SizeChart, locale: IssueLocale): SizeGridDraft {
  const savedTexts = useMemo(() => chartToTexts(saved), [saved]);
  const [edits, setEdits] = useState<{ base: GridTexts; texts: GridTexts } | null>(null);
  // Edits made on top of an older chart are dropped when the saved chart changes.
  const draft = edits && edits.base === savedTexts ? edits.texts : null;
  const texts = draft ?? savedTexts;
  const verdict = useMemo(() => judgeGrid(savedTexts, texts, locale), [savedTexts, texts, locale]);
  const edit = useCallback(
    (size: string, field: MeasurementField, value: string) =>
      setEdits({ base: savedTexts, texts: setCell(draft ?? savedTexts, size, field, value) }),
    [draft, savedTexts],
  );
  const discard = useCallback(() => setEdits(null), []);
  useLeaveWarning(verdict.dirty.size > 0);
  return { texts, verdict, edit, discard };
}
