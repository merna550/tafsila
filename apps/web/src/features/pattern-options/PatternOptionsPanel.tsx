"use client";
/** The pattern options panel: client, measurement set, ease, seam allowance and fabric width (issue #247). */
import { Button, Card } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, type ReactElement } from "react";
import { ClientSetPicker } from "./components/ClientSetPicker";
import { EasePreference } from "./components/EasePreference";
import { FabricWidthField } from "./components/FabricWidthField";
import { SeamAllowanceFields } from "./components/SeamAllowanceFields";
import { usePickerSources } from "./hooks/use-selected-option-sources";
import {
  defaultPatternOptions,
  isDefaultSeamAllowance,
  autoSelection,
  withClient,
  withSeamAllowance,
  type PatternOptionsValue,
} from "./model/pattern-options";

/** Props for {@link PatternOptionsPanel}. */
export interface PatternOptionsPanelProps {
  /** The options; the page keeps them (the panel has no saved state of its own). */
  readonly value: PatternOptionsValue;
  /** Called with the new options after every valid edit. */
  readonly onChange: (value: PatternOptionsValue) => void;
  /** Client from `?clientId=`; applied only while no client is chosen. */
  readonly preselectClientId?: string | null;
  /** When given, a "save options" button shows, disabled until a client and a set are chosen. */
  readonly onSave?: () => void;
  /** True while saving. */
  readonly saving?: boolean;
}

/**
 * Renders the panel and applies the preselected client and its newest set.
 *
 * @param props - The value, the change handler and the optional preselection and save button.
 * @returns The panel.
 */
export function PatternOptionsPanel({
  value,
  onChange,
  preselectClientId = null,
  onSave,
  saving = false,
}: Readonly<PatternOptionsPanelProps>): ReactElement {
  const t = useTranslations("patternOptions");
  const sources = usePickerSources(value.clientId);
  const auto = useMemo(
    () => autoSelection(value, preselectClientId, sources.sets),
    [value, preselectClientId, sources.sets],
  );
  useEffect(() => {
    if (auto !== null) onChange(auto);
  }, [auto, onChange]);
  return (
    <Card className="flex flex-col gap-4 p-4">
      <h2 className="text-lg font-semibold text-text">{t("title")}</h2>
      <ClientSetPicker
        clients={sources.clients}
        clientId={value.clientId}
        sets={sources.sets}
        setId={value.measurementSetId}
        setsLoading={sources.setsLoading}
        onClient={(id) => onChange(withClient(value, id))}
        onSet={(id) => onChange({ ...value, measurementSetId: id })}
      />
      <EasePreference
        value={value.easeProfile}
        onChange={(easeProfile) => onChange({ ...value, easeProfile })}
      />
      <SeamAllowanceFields
        valueMm={value.seamAllowanceMm}
        isDefault={isDefaultSeamAllowance(value)}
        onChange={(kind, mm) => onChange(withSeamAllowance(value, kind, mm))}
        onResetAll={() => onChange({ ...value, seamAllowanceMm: defaultPatternOptions().seamAllowanceMm })}
      />
      <FabricWidthField
        valueMm={value.fabricWidthMm}
        onChange={(fabricWidthMm) => onChange({ ...value, fabricWidthMm })}
      />
      {onSave ? (
        <Button
          onClick={onSave}
          disabled={saving || value.clientId === null || value.measurementSetId === null}
        >
          {t("save")}
        </Button>
      ) : null}
    </Card>
  );
}
