/** One design card: garment drawing, title and type, client, last change, version count and state; the card opens the design and a button asks to delete it. */
import { Badge } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { DesignRow as DesignRowView } from "@/entities/design";
import { OptionIllustration } from "@/features/design-picker";
import { Link } from "@/shared/i18n";
import { DesignStatusBadge } from "./DesignStatusBadge";

/** Props for {@link DesignRow}. */
interface DesignRowProps {
  /** The design to show. */
  readonly row: DesignRowView;
  /** Asks to delete this design. */
  readonly onDelete: (row: DesignRowView) => void;
}

/**
 * Renders a design as a card.
 *
 * @param props - The row and the delete handler.
 * @returns A list item.
 */
export function DesignRow({ row, onDelete }: Readonly<DesignRowProps>): ReactElement {
  const t = useTranslations("designs.row");
  const picker = useTranslations("designPicker.category");
  return (
    <li className="flex flex-col gap-2 rounded-lg bg-surface p-4 shadow-card">
      <Link
        href={`/designs/${row.id}`}
        className="flex flex-col gap-3 rounded-md hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
      >
        <span className="flex h-28 items-center justify-center rounded-md bg-background p-3 text-primary">
          <OptionIllustration path="category" value={row.category} />
        </span>
        <span className="flex items-start justify-between gap-2">
          <strong className="min-w-0 break-words text-lg font-semibold text-text">{row.title}</strong>
          <Badge tone="info" className="shrink-0">
            {picker(row.category)}
          </Badge>
        </span>
        <span className="flex flex-col text-base text-muted">
          {row.clientName === null ? null : <span>{t("client", { name: row.clientName })}</span>}
          <span>{t("updated", { when: row.updated })}</span>
        </span>
        <span className="flex items-center justify-between gap-2 text-base">
          <span className={row.versionCount === 0 ? "text-muted" : "font-semibold text-text"}>
            {t("versions", { count: row.versionCount })}
          </span>
          <DesignStatusBadge status={row.status} />
        </span>
      </Link>
      <button
        type="button"
        onClick={() => onDelete(row)}
        className="min-h-11 self-start rounded-md px-3 text-sm font-semibold text-danger hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
      >
        {t("delete")}
        <span className="sr-only"> {row.title}</span>
      </button>
    </li>
  );
}
