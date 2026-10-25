"use client";
/** The state the pattern page owns for the viewer: layers, selection, highlight and measure (issue #243). */
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { PatternViewerHandle, ViewerLayers, ViewerMeasure, ViewerTarget } from "../model/types";

/** State the page owns for the viewer and passes to the viewer and the panels beside it. */
export interface ViewerController {
  /** Layers shown. */
  readonly layers: ViewerLayers;
  /** Replaces the layers. */
  readonly setLayers: (layers: ViewerLayers) => void;
  /** Flips one layer. */
  readonly toggleLayer: (layer: keyof ViewerLayers) => void;
  /** The selected piece, or null. */
  readonly selectedPieceId: string | null;
  /** Selects a piece, or clears the selection with null. */
  readonly selectPiece: (id: string | null) => void;
  /** What is highlighted. */
  readonly highlight: readonly ViewerTarget[];
  /** Replaces the highlight. */
  readonly setHighlight: (targets: readonly ViewerTarget[]) => void;
  /** The measure tool state. */
  readonly measure: ViewerMeasure;
  /** Replaces the measure tool state. */
  readonly setMeasure: (measure: ViewerMeasure) => void;
  /** Pass to the viewer's `ref` to call `fit` and `zoomTo`. */
  readonly ref: RefObject<PatternViewerHandle | null>;
}

/** localStorage key of the layer choice; a per-viewer convenience only. */
export const VIEWER_LAYERS_KEY = "tafsila.viewer.layers";

/** Layers shown the first time: everything but the grid. */
export const DEFAULT_VIEWER_LAYERS: ViewerLayers = {
  cut: true,
  stitch: true,
  notches: true,
  labels: true,
  grid: false,
};

/** The measure tool before anyone uses it. */
const IDLE_MEASURE: ViewerMeasure = { active: false, points: [] };

/**
 * Reads the saved layers; any problem (blocked storage, bad JSON) gives the defaults.
 *
 * @returns The layers to start from.
 */
export function readSavedLayers(): ViewerLayers {
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(VIEWER_LAYERS_KEY) ?? "null");
    if (typeof raw !== "object" || raw === null) return DEFAULT_VIEWER_LAYERS;
    const saved = raw as Partial<Record<keyof ViewerLayers, unknown>>;
    /**
     * One saved flag, or its default when missing or not a boolean.
     *
     * @param k - The layer.
     * @returns The flag.
     */
    const pick = (k: keyof ViewerLayers): boolean =>
      typeof saved[k] === "boolean" ? saved[k] : DEFAULT_VIEWER_LAYERS[k];
    return {
      cut: pick("cut"),
      stitch: pick("stitch"),
      notches: pick("notches"),
      labels: pick("labels"),
      grid: pick("grid"),
    };
  } catch {
    return DEFAULT_VIEWER_LAYERS;
  }
}

/**
 * Saves the layers for next time; failures are ignored.
 *
 * @param layers - The layers to save.
 */
function saveLayers(layers: ViewerLayers): void {
  try {
    window.localStorage.setItem(VIEWER_LAYERS_KEY, JSON.stringify(layers));
  } catch {
    // Storage is blocked or full: the choice just does not survive a reload.
  }
}

/**
 * Creates the controller the page passes to the viewer and to the panels beside it. Plain React state.
 *
 * @returns The controller.
 */
export function useViewerState(): ViewerController {
  const [layers, setLayersState] = useState<ViewerLayers>(DEFAULT_VIEWER_LAYERS);
  const [selectedPieceId, selectPiece] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<readonly ViewerTarget[]>([]);
  const [measure, setMeasure] = useState<ViewerMeasure>(IDLE_MEASURE);
  const ref = useRef<PatternViewerHandle | null>(null);

  // Read after mount so the server and the first client render agree.
  useEffect(() => setLayersState(readSavedLayers()), []);

  const setLayers = useCallback((next: ViewerLayers) => {
    setLayersState(next);
    saveLayers(next);
  }, []);
  const toggleLayer = useCallback(
    (layer: keyof ViewerLayers) => setLayers({ ...layers, [layer]: !layers[layer] }),
    [layers, setLayers],
  );

  return useMemo(
    () => ({
      layers,
      setLayers,
      toggleLayer,
      selectedPieceId,
      selectPiece,
      highlight,
      setHighlight,
      measure,
      setMeasure,
      ref,
    }),
    [layers, setLayers, toggleLayer, selectedPieceId, highlight, measure],
  );
}
