"use client";
/** The /admin/users/[id] screen: one user's contact data and counts, read-only. Never measurements or notes. */
import { Breadcrumb, Card, PageHeader } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, type ReactElement, type ReactNode } from "react";
import { DataState } from "@/shared/data-state";
import { Link, type AppLocale } from "@/shared/i18n";
import { PhoneCell, EMPTY_CELL } from "./components/PhoneCell";
import { useAdminUser } from "./hooks/use-admin-user";
import { displayName, toAdminUserDetail } from "./model/user-view";

/** Props for {@link AdminUserScreen}. */
interface AdminUserScreenProps {
  /** User id from the URL. */
  readonly id: string;
}

/**
 * Loads one user and shows the detail card.
 *
 * @param props - User id.
 * @returns The screen.
 */
export function AdminUserScreen({ id }: Readonly<AdminUserScreenProps>): ReactElement {
  const t = useTranslations("admin.users");
  const locale = useLocale() as AppLocale;
  const query = useAdminUser(id);
  const view = useMemo(
    () => (query.data ? toAdminUserDetail(query.data, new Date(), locale) : undefined),
    [query.data, locale],
  );
  const link = (
    <Link href="/admin/users" className="font-semibold text-primary underline">
      {t("title")}
    </Link>
  );
  return (
    <>
      <Breadcrumb
        label={t("detail.breadcrumb")}
        items={[
          { key: "users", content: link },
          { key: "user", content: view ? displayName(view) : t("detail.title") },
        ]}
      />
      <DataState
        isPending={query.isPending}
        error={query.error}
        isEmpty={false}
        onRetry={() => void query.refetch()}
      >
        {view ? (
          <>
            <PageHeader title={displayName(view) || t("detail.title")} />
            <Card>
              <dl className="m-0 grid gap-4 sm:grid-cols-2">
                <Item label={t("detail.email")}>
                  {view.email ? <span dir="ltr">{view.email}</span> : EMPTY_CELL}
                </Item>
                <Item label={t("columns.phone")}>
                  <PhoneCell phone={view.phone} verified={view.phoneVerified} />
                </Item>
                <Item label={t("columns.joined")}>{view.joined}</Item>
                <Item label={t("columns.lastSignIn")}>{view.lastSignIn ?? EMPTY_CELL}</Item>
                <Item label={t("columns.clients")}>{view.clientCount}</Item>
                <Item label={t("detail.measurementSets")}>{view.measurementSetCount}</Item>
                <Item label={t("detail.language")}>{t(`detail.languages.${view.locale}`)}</Item>
                <Item label={t("detail.role")}>{t(`detail.roles.${view.role}`)}</Item>
              </dl>
            </Card>
            <p className="text-sm text-muted">{t("privacy")}</p>
          </>
        ) : null}
      </DataState>
    </>
  );
}

/** Props for {@link Item}. */
interface ItemProps {
  /** Term. */
  readonly label: string;
  /** Description. */
  readonly children: ReactNode;
}

/**
 * One term and its value in the detail card.
 *
 * @param props - Label and value.
 * @returns The pair.
 */
function Item({ label, children }: Readonly<ItemProps>): ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="m-0 text-base font-medium text-text">{children}</dd>
    </div>
  );
}
