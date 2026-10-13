/** A group of measurement boxes in a card; the first group is open, the others fold to one summary row (values stay in the form). */
import { ChevronDownIcon } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useState, type ReactElement, type ReactNode } from "react";
import type { FieldGroupId } from "../model/field-groups";

/** Props for {@link FieldGroup}. */
interface FieldGroupProps {
  /** Which group. */
  readonly id: FieldGroupId;
  /** Number of measurements in it. */
  readonly count: number;
  /** The size the values come from, or undefined for a custom set. */
  readonly size?: string;
  /** Whether it starts open. */
  readonly defaultOpen: boolean;
  /** True when a box inside has a problem: the group stays open so it is seen. */
  readonly hasIssue: boolean;
  /** The measurement boxes. */
  readonly children: ReactNode;
}

/**
 * Renders a collapsible card. The boxes stay mounted when folded, so typed values are kept.
 *
 * @param props - Group, summary data and the boxes.
 * @returns The card.
 */
export function FieldGroup({
  id,
  count,
  size,
  defaultOpen,
  hasIssue,
  children,
}: Readonly<FieldGroupProps>): ReactElement {
  const t = useTranslations("measurements.groups");
  const [open, setOpen] = useState(defaultOpen);
  const shown = open || hasIssue;
  const panelId = `group-${id}`;
  return (
    <section className="rounded-lg bg-surface p-4 shadow-card sm:p-5">
      <button
        type="button"
        aria-expanded={shown}
        aria-controls={panelId}
        onClick={() => setOpen(!shown)}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-start"
      >
        <h2 className="text-xl font-semibold text-text">{t(id)}</h2>
        {shown ? null : (
          <span className="flex items-center gap-2 text-sm text-muted">
            {size ? t("summarySize", { count, size }) : t("summaryCustom", { count })}
            <ChevronDownIcon className="size-4" />
          </span>
        )}
      </button>
      <div id={panelId} hidden={!shown} className="mt-4 grid gap-5 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}
