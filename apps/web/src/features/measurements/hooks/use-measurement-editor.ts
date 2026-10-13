"use client";
/** Hook behind the editor screen: the form, saving, the start mode, the guide dialog and the submit handler. */
import type { MeasurementSet, SizeChartResponse } from "@tafsila/schemas";
import { useLocale } from "next-intl";
import { useCallback, useState, type BaseSyntheticEvent } from "react";
import { useRouter, type AppLocale } from "@/shared/i18n";
import type { MeasurementField } from "../model/field-groups";
import { startModeOf, type StartMode } from "../model/start-mode";
import { useMeasurementForm, type MeasurementForm } from "./use-measurement-form";
import { useMeasurementSaveAction } from "./use-measurement-save-action";

/** What the editor screen needs. */
export interface MeasurementEditorState {
  /** The form state. */
  readonly state: MeasurementForm;
  /** Current start mode. */
  readonly mode: StartMode;
  /** Switches the start mode (custom forgets the size label, keeps the values). */
  readonly changeMode: (mode: StartMode) => void;
  /** The field whose guide is open, if any. */
  readonly guideField: MeasurementField | undefined;
  /** Opens or closes a guide. */
  readonly setGuideField: (field: MeasurementField | undefined) => void;
  /** Submit handler for the `<form>`. */
  readonly onSubmit: (event?: BaseSyntheticEvent) => void;
  /** True while saving. */
  readonly pending: boolean;
}

/** Options of {@link useMeasurementEditor}. */
export interface MeasurementEditorOptions {
  /** The client the set belongs to (create only). */
  readonly clientId: string;
  /** The default size chart. */
  readonly chart: SizeChartResponse;
  /** The set being edited; leave out for a new one. */
  readonly set?: MeasurementSet;
  /** Where to go after saving. */
  readonly profileHref: string;
}

/**
 * Wires the editor screen.
 *
 * @param options - Client, chart, the set being edited and the target after saving.
 * @returns The state the screen renders.
 */
export function useMeasurementEditor(options: Readonly<MeasurementEditorOptions>): MeasurementEditorState {
  const { clientId, chart, set, profileHref } = options;
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const state = useMeasurementForm({ chart: chart.sizes, locale, initial: set });
  const { save, pending } = useMeasurementSaveAction(
    set?.id,
    useCallback(() => router.push(profileHref), [router, profileHref]),
  );
  const [mode, setMode] = useState<StartMode>(startModeOf(set));
  const [guideField, setGuideField] = useState<MeasurementField | undefined>(undefined);
  const handleSubmit = state.form.handleSubmit(() => {
    const body = state.buildBody(set ? undefined : clientId);
    if (body) void save(body);
  });
  /**
   * Switches the start mode; custom forgets the size label and keeps the values.
   *
   * @param next - The new mode.
   */
  const changeMode = (next: StartMode): void => {
    setMode(next);
    if (next === "custom") state.switchToCustom();
  };
  return {
    state,
    mode,
    changeMode,
    guideField,
    setGuideField,
    onSubmit: (event) => void handleSubmit(event),
    pending,
  };
}
