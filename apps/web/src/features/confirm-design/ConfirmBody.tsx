"use client";
/** The confirmation content for one finished analysis: summary, cards by section, unsupported panel and continue bar (FR-DES-03 to FR-DES-07). */
import { specOptions, type FeaturePath } from "@tafsila/engine/spec-rules";
import type { DesignAnalysisResult, DesignSpec } from "@tafsila/schemas";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useReducer, useState, type ReactElement } from "react";
import { EditorNotice, pathMessageKey } from "@/features/design-picker";
import type { AppLocale } from "@/shared/i18n";
import { useValueLabel } from "./hooks/use-value-label";
import {
  canContinue,
  changeFeature,
  confirmFeature,
  dismissReset,
  initConfirmState,
  remainingPaths,
  undoChange,
  type ConfirmState,
} from "./model/confirm-state";
import { featureGroups } from "./model/feature-groups";
import { ContinueBar } from "./components/ContinueBar";
import { FeatureCard } from "./components/FeatureCard";
import { FeatureEditor } from "./components/FeatureEditor";
import { SummaryHeader } from "./components/SummaryHeader";
import { UnsupportedPanel } from "./components/UnsupportedPanel";

/** What the reducer can be asked to do. */
type Action =
  | { readonly type: "confirm"; readonly path: FeaturePath }
  | { readonly type: "change"; readonly path: FeaturePath; readonly value: string | boolean | string[] }
  | { readonly type: "undo" }
  | { readonly type: "dismiss" };

/**
 * Applies one action to the state.
 *
 * @param state - The state.
 * @param action - What happened.
 * @returns The next state.
 */
function reduce(state: ConfirmState, action: Action): ConfirmState {
  switch (action.type) {
    case "confirm":
      return confirmFeature(state, action.path);
    case "change":
      return changeFeature(state, action.path, action.value);
    case "undo":
      return undoChange(state);
    case "dismiss":
      return dismissReset(state);
  }
}

/** Props for {@link ConfirmBody}. */
interface ConfirmBodyProps {
  /** The finished analysis. */
  readonly result: DesignAnalysisResult;
  /** True while the draft is being handed over. */
  readonly busy: boolean;
  /** Goes on to the pattern with the confirmed spec. */
  readonly onContinue: (spec: DesignSpec) => void;
}

/**
 * Renders the confirmation of one analysis and keeps its local state.
 *
 * @param props - The analysis and the continue handler.
 * @returns The content.
 */
export function ConfirmBody({ result, busy, onContinue }: Readonly<ConfirmBodyProps>): ReactElement {
  const picker = useTranslations("designPicker");
  const locale = useLocale() as AppLocale;
  const valueLabel = useValueLabel();
  const [state, dispatch] = useReducer(reduce, result, initConfirmState);
  const [editing, setEditing] = useState<FeaturePath | null>(null);
  const groups = useMemo(() => featureGroups(specOptions(state.spec)), [state.spec]);
  const remaining = remainingPaths(state);
  /**
   * Finds the AI's note for a feature in the user's language.
   *
   * @param path - The feature.
   * @returns The note, or undefined.
   */
  const noteFor = (path: FeaturePath): string | undefined =>
    result.notes.find((note) => note.path === path)?.text[locale];
  return (
    <div className="flex flex-col gap-5">
      <SummaryHeader result={result} category={state.spec.category} />
      <UnsupportedPanel items={result.unsupported} />
      <EditorNotice
        paths={state.resetPaths}
        onUndo={() => dispatch({ type: "undo" })}
        onDismiss={() => dispatch({ type: "dismiss" })}
      />
      {groups.map((group) => (
        <section
          key={group.section}
          aria-label={picker(`sections.${group.section}`)}
          className="flex flex-col gap-3"
        >
          <h2 className="m-0 text-lg font-semibold">{picker(`sections.${group.section}`)}</h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {group.paths.map((path) => (
              <FeatureCard
                key={path}
                title={picker(`paths.${pathMessageKey(path)}`)}
                valueLabel={valueLabel(state.spec, path)}
                confidence={result.confidence[path]}
                needsConfirm={state.unconfirmed.has(path)}
                fromAi={valueLabel(state.spec, path) === valueLabel(result.spec, path)}
                note={noteFor(path)}
                editing={editing === path}
                onConfirm={() => dispatch({ type: "confirm", path })}
                onToggleEdit={() => setEditing(editing === path ? null : path)}
              >
                <FeatureEditor
                  spec={state.spec}
                  path={path}
                  onChange={(p, value) => dispatch({ type: "change", path: p, value })}
                />
              </FeatureCard>
            ))}
          </ul>
        </section>
      ))}
      <ContinueBar
        remaining={remaining.length}
        busy={busy}
        onContinue={() => canContinue(state) && onContinue(state.spec)}
      />
    </div>
  );
}
