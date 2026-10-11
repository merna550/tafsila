/** Table: a data table that scrolls sideways on narrow screens; columns are described, not hand-built. */
import type { ReactElement, ReactNode } from "react";
import { cx } from "./styles";

/** One column of a {@link Table}. */
export interface TableColumn<Row> {
  /** Unique column id. */
  readonly id: string;
  /** Header text (already translated). */
  readonly header: ReactNode;
  /** Renders the cell for a row. */
  readonly cell: (row: Row) => ReactNode;
  /** True for numbers, so they align to the end of the cell. */
  readonly numeric?: boolean;
}

/** Props for {@link Table}. */
export interface TableProps<Row> {
  /** Column descriptions, in display order. */
  readonly columns: readonly TableColumn<Row>[];
  /** Data rows. */
  readonly rows: readonly Row[];
  /** Returns a stable unique key for a row. */
  readonly getRowKey: (row: Row) => string;
  /** Accessible caption (already translated); visually hidden. */
  readonly caption: string;
  /** Extra classes for the scroll container. */
  readonly className?: string;
}

/**
 * Renders a semantic table inside a horizontally scrollable container.
 *
 * @param props - Columns, rows, row key and caption.
 * @returns The table element.
 * @example
 * <Table caption={t("clients.title")} columns={columns} rows={rows} getRowKey={(r) => r.id} />
 */
export function Table<Row>({
  columns,
  rows,
  getRowKey,
  caption,
  className,
}: Readonly<TableProps<Row>>): ReactElement {
  return (
    <div className={cx("overflow-x-auto rounded-lg border border-border bg-surface", className)}>
      <table className="w-full border-collapse text-base text-text">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-hover">
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={cx(
                  "min-h-11 whitespace-nowrap px-4 py-3 text-sm font-semibold text-muted",
                  column.numeric ? "text-end" : "text-start",
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="border-t border-border hover:bg-surface-hover">
              {columns.map((column) => (
                <td key={column.id} className={cx("px-4 py-3", column.numeric ? "text-end" : "text-start")}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
