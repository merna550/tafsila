"use client";
/** Hook that loads the design, starts the editor store and derives what the frame shows. */
import { defaultSpec, specOptions, type FeaturePath, type SpecOptions } from "@tafsila/engine/spec-rules";
import type { DesignDetail, DesignSpec, GarmentCategory } from "@tafsila/schemas";
import type { UseQueryResult } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { sectionsFor, type SectionId } from "../model/sections";
import { customisedSections } from "../model/spec-summary";
import { useDesign } from "./use-design";
import { useEditorStore, type EditorStore } from "./use-editor-store";

/** What the editor frame needs to render. */
export interface EditorFrame {
  /** The design query (loading and error states). */
  readonly design: UseQueryResult<DesignDetail>;
  /** True once the store holds this design's spec. */
  readonly ready: boolean;
  /** The garment type, once loaded. */
  readonly category: GarmentCategory | undefined;
  /** The sections this garment uses. */
  readonly sections: readonly SectionId[];
  /** Sections the tailor changed. */
  readonly done: readonly SectionId[];
  /** The open section: the requested one when this garment has it, else the first. */
  readonly active: SectionId | undefined;
  /** Features the rules changed on the last choice. */
  readonly spec: DesignSpec | null;
  readonly options: SpecOptions | null;
  readonly setFeature: EditorStore["setFeature"];
  readonly setOverride: EditorStore["setOverride"];
  readonly resetPaths: readonly FeaturePath[];
  /** Restores the previous design. */
  readonly undo: () => void;
  /** Hides the reset notice. */
  readonly dismissNotice: () => void;
}

/**
 * Loads a design, hydrates the store once and derives the sections.
 *
 * @param id - Design id.
 * @param requested - The section asked for in the URL.
 * @returns What the frame renders.
 */
export function useEditorFrame(id: string, requested: SectionId | undefined): EditorFrame {
  const design = useDesign(id);
  const designId = useEditorStore((s) => s.designId);
  const spec = useEditorStore((s) => s.spec);
  const resetPaths = useEditorStore((s) => s.resetPaths);
  const hydrate = useEditorStore((s) => s.hydrate);
  const setFeature = useEditorStore((s) => s.setFeature);
  const setOverride = useEditorStore((s) => s.setOverride);
  const undo = useEditorStore((s) => s.undo);
  const dismissNotice = useEditorStore((s) => s.dismissNotice);
  const category = design.data?.design.category;
  const savedSpec = design.data?.currentVersion?.spec;
  useEffect(() => {
    if (category !== undefined) hydrate(id, savedSpec ?? defaultSpec(category));
  }, [category, savedSpec, hydrate, id]);
  const options = useMemo(() => (spec === null ? null : specOptions(spec)), [spec]);
  const sections = useMemo(() => (options === null ? [] : sectionsFor(options)), [options]);
  const done = useMemo(() => (spec === null ? [] : customisedSections(spec, sections)), [spec, sections]);
  return {
    design,
    ready: designId === id && spec !== null,
    category,
    sections,
    done,
    active: sections.find((s) => s === requested) ?? sections[0],
    spec,
    options,
    setFeature,
    setOverride,
    resetPaths,
    undo,
    dismissNotice,
  };
}
