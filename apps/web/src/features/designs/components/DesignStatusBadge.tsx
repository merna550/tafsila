/** Small coloured dot with the validation state of a design's newest version (never colour alone: the text is always there). */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { DesignRowStatus } from "@/entities/design";

/** Props for {@link DesignStatusBadge}. */
interface DesignStatusBadgeProps {
  /** The state to show. */
  readonly status: DesignRowStatus;
}

/** Dot colour per state. */
const DOT: Record<DesignRowStatus, string> = {
  pass: "bg-success",
  warn: "bg-warning",
  none: "bg-muted",
};

/**
 * Renders the dot and its label.
 *
 * @param props - The state.
 * @returns The badge.
 */
export function DesignStatusBadge({ status }: Readonly<DesignStatusBadgeProps>): ReactElement {
  const t = useTranslations("designs.status");
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted">
      <span aria-hidden="true" className={`size-2 rounded-full ${DOT[status]}`} />
      {t(status)}
    </span>
  );
}
