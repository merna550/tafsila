"use client";
/** Fabric width in centimetres, checked against 50 to 300 cm (FR-VAL-08, issue #247). */
import { DEFAULT_FABRIC_WIDTH_MM, FABRIC_WIDTH_LIMITS_MM } from "@tafsila/schemas";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { CmField } from "./CmField";

/** Props for {@link FabricWidthField}. */
export interface FabricWidthFieldProps {
  /** The width in mm. */
  readonly valueMm: number;
  /** Called with a valid width in mm. */
  readonly onChange: (mm: number) => void;
}

/**
 * Renders the fabric width field with the shared limits and default.
 *
 * @param props - The value and the change handler.
 * @returns The field.
 */
export function FabricWidthField({ valueMm, onChange }: Readonly<FabricWidthFieldProps>): ReactElement {
  const t = useTranslations("patternOptions");
  return (
    <CmField
      label={t("fabricWidth")}
      valueMm={valueMm}
      limit={{ minMm: FABRIC_WIDTH_LIMITS_MM.min, maxMm: FABRIC_WIDTH_LIMITS_MM.max }}
      defaultMm={DEFAULT_FABRIC_WIDTH_MM}
      onChange={onChange}
    />
  );
}
