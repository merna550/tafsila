"use client";
/** Hook behind the calculator screen: form state, the nesting worker, the automatic save and the view to show (issue #318). */
import { DEFAULT_FABRIC_OPTIONS, type FabricOptions } from "@tafsila/schemas";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApiErrorHandler } from "@/shared/error-display";
import { useFabricNesting, type FabricNesting } from "@/shared/fabric-nesting";
import { useVersion, versionPreviewInput } from "@/features/pattern-versions";
import { saveBodyOf, viewOfAnswer, viewOfSaved, type CalcView } from "../model/calc-view";
import {
  formToOptions,
  optionsToForm,
  type FabricFormError,
  type FabricFormField,
  type FabricFormValues,
} from "../model/fabric-form";
import { useSaveFabricCalc } from "./use-save-fabric-calc";
import { useSavedFabricCalc } from "./use-saved-fabric-calc";
import { useSlowFlag } from "./use-slow-flag";

/** What the calculator screen needs. */
export interface FabricCalculatorModel {
  /** The version query (loading and error states of the screen). */
  readonly version: ReturnType<typeof useVersion>;
  /** True until the saved calculation has loaded. */
  readonly loadingSaved: boolean;
  /** The worker's state and cancel. */
  readonly nesting: FabricNesting;
  /** True once the current run lasted longer than the soft limit. */
  readonly slow: boolean;
  /** The form fields. */
  readonly values: FabricFormValues;
  /** One message key per wrong field. */
  readonly errors: Partial<Record<FabricFormField, FabricFormError>>;
  /** Changes form fields. */
  readonly change: (patch: Partial<FabricFormValues>) => void;
  /** Calculates with the current form. */
  readonly submit: () => void;
  /** Switches to the open layout and calculates. */
  readonly tryOpen: () => void;
  /** What to show: the fresh result, else the saved one, else nothing. */
  readonly view: CalcView | null;
}

/**
 * Reads the form and starts the worker, remembering the options the run used.
 *
 * @param nesting - The worker hook.
 * @param version - The version query.
 * @param ranWith - Where the options of the last run are kept.
 * @param setErrors - Receives the form's wrong fields.
 * @returns A function that calculates with given form values.
 */
function useCalculate(
  nesting: FabricNesting,
  version: ReturnType<typeof useVersion>,
  ranWith: { current: FabricOptions | null },
  setErrors: (errors: Partial<Record<FabricFormField, FabricFormError>>) => void,
): (values: FabricFormValues) => void {
  const { run } = nesting;
  const detail = version.data;
  return useCallback(
    (values) => {
      const read = formToOptions(values);
      setErrors(read.ok ? {} : read.errors);
      if (!read.ok || !detail) return;
      ranWith.current = read.options;
      run({ input: versionPreviewInput(detail.version), options: read.options });
    },
    [run, detail, ranWith, setErrors],
  );
}

/**
 * Runs the calculator of one saved version. It opens with the saved options and result and calculates only on request;
 * a finished complete result is saved automatically (decision 318 item 1).
 *
 * @param versionId - The saved version.
 * @returns The model for the screen.
 */
export function useFabricCalculator(versionId: string): FabricCalculatorModel {
  const version = useVersion(versionId);
  const saved = useSavedFabricCalc(versionId);
  const nesting = useFabricNesting();
  const { mutate } = useSaveFabricCalc(versionId);
  const handleError = useApiErrorHandler();
  const [values, setValues] = useState<FabricFormValues>(() => optionsToForm(DEFAULT_FABRIC_OPTIONS));
  const [errors, setErrors] = useState<Partial<Record<FabricFormField, FabricFormError>>>({});
  const ranWith = useRef<FabricOptions | null>(null);
  const filled = useRef(false);
  const { state } = nesting;
  const calculate = useCalculate(nesting, version, ranWith, setErrors);

  useEffect(() => {
    if (filled.current || saved.isPending) return;
    filled.current = true;
    if (saved.data) setValues(optionsToForm(saved.data.options));
  }, [saved.isPending, saved.data]);

  useEffect(() => {
    if (state.status === "error") handleError(state.error, "load");
    if (state.status !== "done" || !ranWith.current) return;
    const body = saveBodyOf(state.answer, ranWith.current);
    if (body) mutate(body, { onError: (error) => handleError(error, "action") });
  }, [state, mutate, handleError]);

  /** Switches the form to the open layout and calculates with it. */
  const tryOpen = (): void => {
    const next = { ...values, layout: "open" as const };
    setValues(next);
    calculate(next);
  };
  return {
    version,
    loadingSaved: saved.isPending,
    nesting,
    slow: useSlowFlag(state.status === "running"),
    values,
    errors,
    change: (patch) => setValues((current) => ({ ...current, ...patch })),
    submit: () => calculate(values),
    tryOpen,
    view: pickView(state, ranWith.current, saved.data ?? null),
  };
}

/**
 * Chooses what the screen shows.
 *
 * @param state - The worker state.
 * @param options - The options of the last run.
 * @param saved - The saved calculation.
 * @returns The fresh result when a run finished, else the saved result, else null.
 */
function pickView(
  state: FabricNesting["state"],
  options: FabricOptions | null,
  saved: Parameters<typeof viewOfSaved>[0] | null,
): CalcView | null {
  if (state.status === "done" && options) return viewOfAnswer(state.answer, options);
  return saved ? viewOfSaved(saved) : null;
}
