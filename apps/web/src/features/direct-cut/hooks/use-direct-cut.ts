"use client";
/** Everything the direct-cut screen needs: the version, its steps from the worker, the curve step, the ticks and the chosen piece. */
import { useMemo, useState } from "react";
import { useDesign } from "@/features/design-picker";
import { useVersion, versionPreviewInput } from "@/features/pattern-versions";
import { useCutSteps } from "@/shared/pattern-preview";
import { useCutSettings } from "./use-cut-settings";
import { useTicks } from "./use-ticks";
import type { DirectCut } from "../model/types";

/**
 * Loads one version and works out its direct-cut steps.
 *
 * @param designId - Design id.
 * @param versionId - Version id.
 * @returns Everything the screen shows.
 */
export function useDirectCut(designId: string, versionId: string): DirectCut {
  const query = useVersion(versionId);
  const design = useDesign(designId);
  const settings = useCutSettings();
  const version = query.data?.version;
  const input = useMemo(
    () => (version && settings.loaded ? versionPreviewInput(version) : null),
    [version, settings.loaded],
  );
  const cut = useCutSteps(input, settings.curveStepMm);
  // A plan of another curve step is not shown: its ticks and steps would not match the setting.
  const plan = cut.plan?.curveStepMm === settings.curveStepMm ? cut.plan : undefined;
  const ticks = useTicks(versionId, settings.curveStepMm, plan?.engineVersion);
  const [chosen, setChosen] = useState<string | null>(null);
  const [printView, setPrintView] = useState(false);
  const piece = plan?.pieces.find((p) => p.pieceId === chosen) ?? plan?.pieces[0];
  return {
    query,
    detail: query.data,
    title: design.data?.design.title ?? null,
    steps: { ...cut, plan },
    settings,
    ticks,
    piece,
    choosePiece: setChosen,
    printView,
    setPrintView,
  };
}
