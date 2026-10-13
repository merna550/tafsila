/** The columns of the users table: name with a LTR e-mail, phone with badge, sign-up date, client count and last sign-in. */
import type { TableColumn } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n";
import { displayName, type AdminUserRowView } from "../model/user-view";
import { EMPTY_CELL, PhoneCell } from "./PhoneCell";

/**
 * Describes the table columns with translated headers.
 *
 * @returns The columns, in display order.
 */
export function useAdminUserColumns(): readonly TableColumn<AdminUserRowView>[] {
  const t = useTranslations("admin.users");
  return [
    {
      id: "name",
      header: t("columns.name"),
      cell: (row) => (
        <div className="flex flex-col">
          <Link href={`/admin/users/${row.id}`} className="font-semibold text-primary underline">
            {displayName(row)}
          </Link>
          {row.name && row.email ? (
            <span dir="ltr" className="text-start text-sm text-muted">
              {row.email}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "phone",
      header: t("columns.phone"),
      cell: (row) => <PhoneCell phone={row.phone} verified={row.phoneVerified} />,
    },
    {
      id: "joined",
      header: t("columns.joined"),
      cell: (row) => <span className="text-muted">{row.joined}</span>,
    },
    { id: "clients", header: t("columns.clients"), cell: (row) => row.clientCount },
    {
      id: "lastSignIn",
      header: t("columns.lastSignIn"),
      cell: (row) => <span className="text-muted">{row.lastSignIn ?? EMPTY_CELL}</span>,
    },
  ];
}
