"use client";
/** The pattern page's own store (Zustand): the options being edited and the version they started from. */
import type { PatternOptionsValue } from "@/features/pattern-options";
import { create } from "zustand";
import type { BaseVersion } from "../model/save-state";

/** The options, their baseline and the base version of one design. */
export interface PageState {
  /** The design the state belongs to, or null before loading. */
  readonly designId: string | null;
  /** The options being edited. */
  readonly options: PatternOptionsValue | null;
  /** The options as loaded or last saved; dirty means `options` differs. */
  readonly baseline: PatternOptionsValue | null;
  /** The version the page started from or last saved. */
  readonly baseVersion: BaseVersion | null;
  /** Starts a design; keeps edits already in memory when the same design is loaded again. */
  readonly load: (designId: string, options: PatternOptionsValue, baseVersion: BaseVersion | null) => void;
  /** Replaces the edited options. */
  readonly setOptions: (options: PatternOptionsValue) => void;
  /** Makes the edited options the baseline and records the saved version. */
  readonly markSaved: (baseVersion: BaseVersion) => void;
}

/** The store hook. */
export const usePageStore = create<PageState>((set, get) => ({
  designId: null,
  options: null,
  baseline: null,
  baseVersion: null,
  load: (designId, options, baseVersion) => {
    if (get().designId === designId && get().options !== null) return;
    set({ designId, options, baseline: options, baseVersion });
  },
  setOptions: (options) => set({ options }),
  markSaved: (baseVersion) => set((state) => ({ baseline: state.options, baseVersion })),
}));
