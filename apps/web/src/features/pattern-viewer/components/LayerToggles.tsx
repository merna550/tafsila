"use client";
/** The layer checkboxes beside the canvas: stitch line, cut line, notches, names, grid (issue #248, FR-VIEW-01). */
import { Checkbox } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { ViewerLayers } from "../model/types";

/** Layers in the order of the pattern-page screen. */
const LAYER_ORDER: readonly (keyof ViewerLayers)[] = ["stitch", "cut", "notches", "labels", "grid"];

/** Props of {@link LayerToggles}. */
interface LayerTogglesProps {
  /** Which layers are on. */
  readonly layers: ViewerLayers;
  /** Flips one layer. */
  readonly onToggle: (layer: keyof ViewerLayers) => void;
}

/**
 * One checkbox per layer; each hides or shows its layer in the viewer.
 *
 * @param props - Component props.
 * @returns The group.
 */
export function LayerToggles({ layers, onToggle }: Readonly<LayerTogglesProps>): ReactElement {
  const t = useTranslations("patternViewer.layers");
  return (
    <div role="group" aria-label={t("title")} className="flex flex-wrap gap-x-4">
      {LAYER_ORDER.map((layer) => (
        <label key={layer} className="flex min-h-11 items-center gap-2 text-sm">
          <Checkbox
            checked={layers[layer]}
            onCheckedChange={() => onToggle(layer)}
            data-testid={`layer-${layer}`}
          />
          {t(layer)}
        </label>
      ))}
    </div>
  );
}
