"use client";
/** Dev-only probe that runs the preview hook on one seed design and prints piece count and time (issue #239). */
import { dartedBlouse, onePieceDress, seedDress, sizeM } from "@tafsila/test-fixtures";
import { useMemo, type ReactElement } from "react";
import { usePatternPreview } from "./use-pattern-preview";

/** Seed designs the probe can draft, by the name used in the URL. */
const PROBE_DESIGNS = { seedDress, onePieceDress, dartedBlouse } as const;

/**
 * Whether a value names a probe design.
 *
 * @param name - Value from the URL.
 * @returns True for a known design.
 */
function isProbeDesign(name: string | undefined): name is keyof typeof PROBE_DESIGNS {
  return name !== undefined && Object.hasOwn(PROBE_DESIGNS, name);
}

/**
 * Drafts the chosen seed design at size M in the worker and shows the outcome as plain data.
 *
 * @param props - Component props.
 * @param props.design - Name of a seed design from the URL; the seed dress when unknown.
 * @returns The probe output.
 */
export function PreviewProbe({ design }: Readonly<{ design?: string }>): ReactElement {
  const input = useMemo(
    () => ({ spec: PROBE_DESIGNS[isProbeDesign(design) ? design : "seedDress"], measurements: sizeM }),
    [design],
  );
  const state = usePatternPreview(input);
  return (
    <div data-testid="preview-probe" data-status={state.status} className="font-mono text-sm">
      <span data-testid="preview-pieces">{state.result?.pieces.length ?? ""}</span>
      <span data-testid="preview-ms">
        {state.durationMs === undefined ? "" : Math.round(state.durationMs)}
      </span>
      <span data-testid="preview-hash">{state.inputHash ?? ""}</span>
      <span data-testid="preview-error">{state.error?.code ?? ""}</span>
    </div>
  );
}
