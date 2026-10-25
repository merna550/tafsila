"use client";
/** Hook behind the pattern page: stores to preview input to preview to save state to save (FR-PAT-04). */
import type { DesignDetail, DesignSpec, MeasurementSet, ValidationReport } from "@tafsila/schemas";
import type { UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";
import { selectIsDirty, useEditorStore } from "@/features/design-picker";
import {
  defaultPatternOptions,
  useSelectedOptionSources,
  type PatternOptionsValue,
} from "@/features/pattern-options";
import { useLeaveWarning } from "@/shared/hooks/use-leave-warning";
import { usePatternPreview, type PreviewState } from "@/shared/pattern-preview";
import { optionsEqual } from "../model/options-equal";
import { buildPreviewInput } from "../model/preview-input";
import { canSave, saveStateOf, type BaseVersion, type SaveState } from "../model/save-state";
import { useLoadDesign } from "./use-load-design";
import { usePageStore } from "./use-page-store";
import { useSaveAction } from "./use-save-action";

/** What the screen shows and does. */
export interface PatternPage {
  /** The design query (loading and error). */
  readonly design: UseQueryResult<DesignDetail>;
  /** True once the stores hold this design. */
  readonly ready: boolean;
  /** The spec being edited. */
  readonly spec: DesignSpec | null;
  /** The options being edited. */
  readonly options: PatternOptionsValue;
  /** Replaces the options. */
  readonly setOptions: (options: PatternOptionsValue) => void;
  /** The chosen measurement set, once loaded. */
  readonly set: MeasurementSet | undefined;
  /** The live preview. */
  readonly preview: PreviewState;
  /** The save area's state. */
  readonly saveState: SaveState;
  /** Whether Save may be pressed. */
  readonly savable: boolean;
  /** Saves the current inputs as a version. */
  readonly save: () => void;
  /** The version the page started from or last saved, if any. */
  readonly baseVersion: BaseVersion | null;
  /** The server's failed report while the same inputs stay refused, else null. */
  readonly rejected: ValidationReport | null;
}

/**
 * The pattern page's data flow in one direction.
 *
 * @param designId - Design id from the URL.
 * @param urlClientId - Client from the URL, if any.
 * @returns Everything the screen renders and does.
 */
export function usePatternPage(designId: string, urlClientId: string | undefined): PatternPage {
  const { design, ready } = useLoadDesign(designId, urlClientId);
  const spec = useEditorStore((s) => s.spec);
  const specDirty = useEditorStore(selectIsDirty);
  const storedOptions = usePageStore((s) => s.options);
  const baseline = usePageStore((s) => s.baseline);
  const baseVersion = usePageStore((s) => s.baseVersion);
  const setOptions = usePageStore((s) => s.setOptions);
  const options = useMemo(() => storedOptions ?? defaultPatternOptions(), [storedOptions]);
  const { client, set, isLoading } = useSelectedOptionSources(options);
  const input = useMemo(
    () => buildPreviewInput({ spec, options, set, clientName: client?.name }),
    [spec, options, set, client?.name],
  );
  const preview = usePatternPreview(input);
  const action = useSaveAction({ designId, spec, options, set, clientName: client?.name, input });
  const dirty = specDirty || !optionsEqual(storedOptions, baseline);
  const saveState = saveStateOf({
    loading: !ready || isLoading,
    currentInput: input,
    preview,
    rejected: action.rejected !== null,
    saving: action.saving,
    dirty,
    baseVersion,
  });
  useLeaveWarning(dirty && saveState.kind !== "saved");
  return {
    design,
    ready,
    spec,
    options,
    setOptions,
    set,
    preview,
    saveState,
    savable: canSave(saveState),
    save: action.save,
    baseVersion,
    rejected: action.rejected,
  };
}
