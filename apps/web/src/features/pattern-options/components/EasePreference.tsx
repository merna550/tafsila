"use client";
/** Ease preference: fitted, regular or loose, with one plain line and the engine's bust, waist and hip ease (FR-MEAS-06). */
import type { EaseProfile } from "@tafsila/schemas";
import { Badge, SegmentedControl } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { EASE_PROFILES, easeRows } from "../model/pattern-options";

/** Props for {@link EasePreference}. */
export interface EasePreferenceProps {
  /** The chosen preference. */
  readonly value: EaseProfile;
  /** Called with the new preference. */
  readonly onChange: (profile: EaseProfile) => void;
}

/** The ease preferences whose numbers are proposals (decision 126). */
const PROPOSED: ReadonlySet<EaseProfile> = new Set(["fitted", "loose"]);

/**
 * Renders the three preferences as a segmented control and explains the chosen one.
 *
 * @param props - The value and the change handler.
 * @returns The group.
 */
export function EasePreference({ value, onChange }: Readonly<EasePreferenceProps>): ReactElement {
  const t = useTranslations("patternOptions.ease");
  const rows = easeRows(value);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-text">{t("title")}</span>
      <SegmentedControl
        label={t("title")}
        value={value}
        onChange={onChange}
        className="w-full [&>button]:flex-1"
        options={EASE_PROFILES.map((profile) => ({ value: profile, label: t(`profiles.${profile}`) }))}
      />
      <p className="text-sm text-muted">{t(`explain.${value}`)}</p>
      <p className="text-sm text-text">{t("values", rows)}</p>
      {PROPOSED.has(value) ? <Badge tone="warning">{t("proposed")}</Badge> : null}
    </div>
  );
}
