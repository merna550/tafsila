/** The fabric list: names, the four property meters, the review status and the edit and delete actions. */
import type { AdminFabric } from "@tafsila/schemas";
import { Badge, Button, Table, type TableColumn } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { LevelDots, SHOWN_PROPERTIES, fabricAltName, fabricName, type TextLocale } from "@/features/fabric";
import { Link } from "@/shared/i18n";

/** Props of {@link FabricsTable}. */
interface FabricsTableProps {
  /** The fabrics. */
  readonly fabrics: readonly AdminFabric[];
  /** Interface language. */
  readonly locale: TextLocale;
  /** Asks to delete a fabric. */
  readonly onDelete: (fabric: AdminFabric) => void;
}

/** Props of {@link NameCell}. */
interface NameCellProps {
  /** The fabric. */
  readonly fabric: AdminFabric;
  /** Interface language. */
  readonly locale: TextLocale;
}

/**
 * The first cell: the name as a link to the editor and the other language's name small under it.
 *
 * @param props - The fabric and the language.
 * @returns The cell.
 */
function NameCell({ fabric, locale }: Readonly<NameCellProps>): ReactElement {
  return (
    <div className="flex flex-col">
      <Link
        href={`/admin/fabrics/${fabric.id}`}
        className="flex min-h-11 items-center font-semibold text-text hover:underline"
      >
        {fabricName(fabric, locale)}
      </Link>
      <span dir="ltr" className="text-start text-sm text-muted">
        {fabricAltName(fabric, locale)}
      </span>
    </div>
  );
}

/**
 * Renders the table.
 *
 * @param props - Fabrics, language and the delete handler.
 * @returns The table.
 */
export function FabricsTable({ fabrics, locale, onDelete }: Readonly<FabricsTableProps>): ReactElement {
  const t = useTranslations("admin.fabrics");
  const labels = useTranslations("fabric.recommend.properties");
  const properties = SHOWN_PROPERTIES.map((name): TableColumn<AdminFabric> => ({
    id: name,
    header: labels(name),
    cell: (f) => (
      <>
        <LevelDots filled={f.properties[name] + 1} />
        <span className="sr-only">{t("levelOf", { level: f.properties[name] + 1 })}</span>
      </>
    ),
  }));
  const columns: TableColumn<AdminFabric>[] = [
    { id: "name", header: t("columns.fabric"), cell: (f) => <NameCell fabric={f} locale={locale} /> },
    ...properties,
    {
      id: "status",
      header: t("columns.status"),
      cell: (f) => (
        <Badge tone={f.isDraft ? "warning" : "success"}>
          {t(f.isDraft ? "status.draft" : "status.reviewed")}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("columns.actions")}</span>,
      cell: (f) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/fabrics/${f.id}`}
            className="flex min-h-11 items-center font-semibold text-primary underline"
          >
            {t("edit")}
          </Link>
          <Button
            variant="ghost"
            onClick={() => onDelete(f)}
            aria-label={t("deleteNamed", { name: fabricName(f, locale) })}
          >
            {t("deleteAction")}
          </Button>
        </div>
      ),
    },
  ];
  return <Table caption={t("caption")} columns={columns} rows={fabrics} getRowKey={(f) => f.id} />;
}
