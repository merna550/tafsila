/** The four overview numbers above the users table. */
import { StatTile } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { AdminStats } from "@tafsila/schemas";

/** Placeholder shown while the numbers load or failed to load. */
const NO_VALUE = "-";

/** Props for {@link AdminStatTiles}. */
interface AdminStatTilesProps {
  /** The numbers, or undefined while loading or after an error. */
  readonly stats: AdminStats | undefined;
}

/**
 * Renders users, verified phones, sign-ups of the week and clients as tiles.
 *
 * @param props - The numbers.
 * @returns The tiles.
 */
export function AdminStatTiles({ stats }: Readonly<AdminStatTilesProps>): ReactElement {
  const t = useTranslations("admin.users.stats");
  const tiles: readonly { key: string; label: string; value: number | undefined }[] = [
    { key: "users", label: t("users"), value: stats?.users },
    { key: "verified", label: t("verified"), value: stats?.verifiedPhones },
    { key: "week", label: t("week"), value: stats?.signupsLast7Days },
    { key: "clients", label: t("clients"), value: stats?.clients },
  ];
  return (
    <dl className="m-0 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <StatTile key={tile.key} label={tile.label} value={tile.value ?? NO_VALUE} />
      ))}
    </dl>
  );
}
