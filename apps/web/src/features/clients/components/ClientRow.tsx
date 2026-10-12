/** One row of the clients list: initial avatar, name, one meta line and a chevron; the whole row opens the profile. */
import { ChevronEndIcon } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";
import type { ClientMeta, ClientRowView } from "../model/client-view";

/** Props for {@link ClientRow}. */
interface ClientRowProps {
  /** The row to show. */
  readonly row: ClientRowView;
}

/**
 * Picks the meta text for the three forms (size, custom, none).
 *
 * @param meta - Meta data of the row.
 * @param t - Translator of `clients.meta`.
 * @returns The line.
 */
function metaText(meta: ClientMeta, t: ReturnType<typeof useTranslations>): string {
  if (meta.kind === "size") return t("size", { size: meta.size, when: meta.when });
  if (meta.kind === "custom") return t("custom", { when: meta.when });
  return t("none");
}

/**
 * Renders a client as a link card.
 *
 * @param props - The row view.
 * @returns A list item.
 */
export function ClientRow({ row }: Readonly<ClientRowProps>): ReactElement {
  const t = useTranslations("clients.meta");
  return (
    <li>
      <Link
        href={`/clients/${row.id}`}
        className="flex min-h-16 items-center gap-3 rounded-lg bg-surface p-4 shadow-card hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
      >
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xl font-semibold text-primary"
        >
          {row.initial}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate text-lg font-semibold text-text">{row.name}</strong>
          <span className="text-sm text-muted">{metaText(row.meta, t)}</span>
        </span>
        <ChevronEndIcon className="size-5 shrink-0 text-muted" />
      </Link>
    </li>
  );
}
