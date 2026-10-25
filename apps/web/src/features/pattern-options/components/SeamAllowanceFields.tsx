"use client";
/** The seam allowance of each edge kind, with a reset for one and for all (FR-PAT-03, issue #247). */
import { SEAM_ALLOWANCE_LIMITS_MM, type EdgeKind } from "@tafsila/schemas";
import { useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import { defaultAllowanceFor, EDGE_KINDS } from "../model/pattern-options";
import { CmField } from "./CmField";

/** Props for {@link SeamAllowanceFields}. */
export interface SeamAllowanceFieldsProps {
  /** The allowances in mm. */
  readonly valueMm: Readonly<Record<EdgeKind, number>>;
  /** True when every allowance is at its default (the "reset all" button is then disabled). */
  readonly isDefault: boolean;
  /** Called with one edge kind and its new valid allowance in mm. */
  readonly onChange: (kind: EdgeKind, mm: number) => void;
  /** Called to put every allowance back to its default. */
  readonly onResetAll: () => void;
}

/**
 * Renders five length fields and a "reset all" button; reset remounts the fields so their text follows the values.
 *
 * @param props - Values, default flag and handlers.
 * @returns The group.
 */
export function SeamAllowanceFields({
  valueMm,
  isDefault,
  onChange,
  onResetAll,
}: Readonly<SeamAllowanceFieldsProps>): ReactElement {
  const t = useTranslations("patternOptions.seam");
  const [generation, setGeneration] = useState(0);
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-semibold text-text">{t("title")}</legend>
      <p className="text-sm text-muted">{t("hint")}</p>
      {EDGE_KINDS.map((kind) => (
        <CmField
          key={`${kind}-${generation}`}
          label={t(`kinds.${kind}`)}
          valueMm={valueMm[kind]}
          limit={{ minMm: SEAM_ALLOWANCE_LIMITS_MM.min, maxMm: SEAM_ALLOWANCE_LIMITS_MM.max }}
          defaultMm={defaultAllowanceFor(kind)}
          onChange={(mm) => onChange(kind, mm)}
        />
      ))}
      <button
        type="button"
        className="min-h-11 self-start rounded-md px-2 text-sm font-semibold text-primary underline disabled:text-muted disabled:no-underline"
        disabled={isDefault}
        onClick={() => {
          onResetAll();
          setGeneration((n) => n + 1);
        }}
      >
        {t("resetAll")}
      </button>
    </fieldset>
  );
}
