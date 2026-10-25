"use client";
/** Hook that saves the page's inputs as a version: the request, the toast, the stores and a refused (422) report. */
import type { DesignSpec, MeasurementSet, ValidationReport } from "@tafsila/schemas";
import { useToast } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { PatternOptionsValue } from "@/features/pattern-options";
import { useEditorStore } from "@/features/design-picker";
import { patternInvalidReport, useSaveVersion } from "@/features/pattern-versions";
import { useApiErrorHandler } from "@/shared/error-display";
import type { PreviewInput } from "@/shared/pattern-preview";
import { buildPageEngineOptions } from "../model/preview-input";
import { usePageStore } from "./use-page-store";

/** What one save needs. */
interface SaveActionArgs {
  /** Design id. */
  readonly designId: string;
  /** The spec being edited. */
  readonly spec: DesignSpec | null;
  /** The options being edited. */
  readonly options: PatternOptionsValue;
  /** The chosen measurement set. */
  readonly set: MeasurementSet | undefined;
  /** The client's name, printed on the pieces. */
  readonly clientName: string | undefined;
  /** The page's current preview input, to tell when a refusal still applies. */
  readonly input: PreviewInput | null;
}

/** What the page gets back. */
export interface SaveAction {
  /** Sends the inputs. */
  readonly save: () => void;
  /** True while the request runs. */
  readonly saving: boolean;
  /** The server's report while the same inputs stay refused, else null. */
  readonly rejected: ValidationReport | null;
}

/**
 * Wires saving: the server re-runs the engine, a refusal shows its report, a success moves the baselines.
 *
 * @param args - The inputs of one save.
 * @returns The save handler, its busy flag and the refusal.
 */
export function useSaveAction(args: SaveActionArgs): SaveAction {
  const { designId, spec, options, set, clientName, input } = args;
  const mutation = useSaveVersion();
  const handleError = useApiErrorHandler();
  const { showToast } = useToast();
  const t = useTranslations("patternPage.save");
  const markSpecSaved = useEditorStore((s) => s.markSaved);
  const markSaved = usePageStore((s) => s.markSaved);
  const [refused, setRefused] = useState<{ input: PreviewInput | null; report: ValidationReport } | null>(
    null,
  );

  /** Sends the inputs; the server re-runs the engine and answers with the version. */
  const save = (): void => {
    const engine = buildPageEngineOptions({ options, set, clientName });
    if (spec === null || set === undefined || engine === null) return;
    const body = {
      spec,
      measurementSetId: set.id,
      easeProfile: options.easeProfile,
      options: { seamAllowance: engine.seamAllowance, fabricWidthMm: engine.fabricWidthMm },
    };
    mutation.mutate(
      { designId, input: body },
      {
        onSuccess: ({ version, reused }) => {
          showToast({ title: t(reused ? "reused" : "done", { n: version.versionNo }), tone: "success" });
          markSpecSaved(spec);
          markSaved({ id: version.id, versionNo: version.versionNo, inputHash: version.inputHash });
        },
        onError: (error) => {
          const report = patternInvalidReport(error);
          if (report === null) handleError(error, "action");
          else setRefused({ input, report });
        },
      },
    );
  };
  return {
    save,
    saving: mutation.isPending,
    rejected: refused !== null && refused.input === input ? refused.report : null,
  };
}
