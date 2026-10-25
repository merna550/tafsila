"use client";
/** The save area: one primary button and the reason it is off (the state comes from `saveStateOf`). */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { canSave, type SaveState } from "../model/save-state";

/** Props of {@link SaveVersionBar}. */
interface SaveVersionBarProps {
  /** The save state. */
  readonly state: SaveState;
  /** Called when Save is pressed. */
  readonly onSave: () => void;
}

/** Message keys of `patternPage.save.hint`. */
type HintKey = "noSet" | "previewing" | "error" | "fail" | "rejected" | "saved" | "outdated";

/**
 * The hint text key under the button for a state, or null when no hint is needed.
 *
 * @param state - The save state.
 * @returns The `patternPage.save.hint` key.
 */
function hintKey(state: SaveState): HintKey | null {
  const keys: Partial<Record<SaveState["kind"], HintKey>> = {
    "no-set": "noSet",
    previewing: "previewing",
    "preview-error": "error",
    fail: "fail",
    "server-rejected": "rejected",
    saved: "saved",
    outdated: "outdated",
  };
  return keys[state.kind] ?? null;
}

/**
 * Renders the save button; it is enabled only for a new or an outdated version.
 *
 * @param props - The state and the save handler.
 * @returns The bar.
 */
export function SaveVersionBar({ state, onSave }: Readonly<SaveVersionBarProps>): ReactElement | null {
  const t = useTranslations("patternPage.save");
  if (state.kind === "loading") return null;
  const key = hintKey(state);
  const saving = state.kind === "saving";
  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" disabled={!canSave(state)} onClick={onSave} data-testid="save-version">
        {saving ? t("saving") : t("label")}
      </Button>
      {key === null ? null : (
        <p className="max-w-64 text-sm text-muted" data-testid="save-hint">
          {t(`hint.${key}`, { n: state.versionNo ?? 0 })}
        </p>
      )}
    </div>
  );
}
