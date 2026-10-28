"use client";
/** The /admin/fabrics/new and /admin/fabrics/[id] screens: one form to add a fabric or edit one. */
import type { AdminFabric } from "@tafsila/schemas";
import { Breadcrumb, Button, PageHeader } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import { fabricName } from "@/features/fabric";
import { DataState } from "@/shared/data-state";
import { DIRECTION, Link, useRouter, type AppLocale } from "@/shared/i18n";
import { DeleteDialog } from "./components/DeleteDialog";
import { FabricFormView } from "./components/FabricFormView";
import { useAdminFabrics } from "./hooks/use-admin-fabrics";
import { useDeleteFabric } from "./hooks/use-catalogue-mutations";
import { useDeleteAction } from "./hooks/use-delete-action";
import { useFabricForm } from "./hooks/use-fabric-form";

/** Props of {@link Editor}. */
interface EditorProps {
  /** The fabric to edit; leave out to add one. */
  readonly fabric?: AdminFabric;
}

/**
 * The page once the fabric is known: breadcrumb, heading, form and the delete action.
 *
 * @param props - The fabric or none.
 * @returns The editor.
 */
function Editor({ fabric }: Readonly<EditorProps>): ReactElement {
  const t = useTranslations("admin.fabrics");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  /** Goes back to the list. */
  const goBack = (): void => {
    router.push("/admin/fabrics");
  };
  const { form, onSubmit, pending } = useFabricForm({ fabric, onSaved: goBack });
  const [deleting, setDeleting] = useState(false);
  const remove = useDeleteAction(useDeleteFabric(), t("delete.done"));
  const name = fabric ? fabricName(fabric, locale) : t("form.newTitle");
  /** Deletes the fabric and goes back to the list when it worked. */
  const confirm = async (): Promise<void> => {
    if (fabric && (await remove.confirm(fabric.id))) goBack();
  };
  return (
    <>
      <Breadcrumb
        label={t("form.breadcrumb")}
        items={[
          { key: "list", content: <Link href="/admin/fabrics">{t("title")}</Link> },
          { key: "name", content: name },
        ]}
      />
      <PageHeader
        title={fabric ? t("form.editTitle", { name }) : t("form.newTitle")}
        description={
          fabric
            ? t("form.statusLine", { status: t(fabric.isDraft ? "status.draft" : "status.reviewed") })
            : undefined
        }
        actions={
          fabric ? (
            <Button variant="dangerOutline" onClick={() => setDeleting(true)}>
              {t("deleteAction")}
            </Button>
          ) : undefined
        }
      />
      <FabricFormView form={form} onSubmit={onSubmit} pending={pending} editing={fabric !== undefined} />
      <DeleteDialog
        kind="fabric"
        open={deleting}
        onOpenChange={setDeleting}
        name={fabric?.nameEn ?? ""}
        onConfirm={() => void confirm()}
        pending={remove.pending}
        dir={DIRECTION[locale]}
      />
    </>
  );
}

/** Props of {@link AdminFabricEditScreen}. */
interface AdminFabricEditScreenProps {
  /** Id of the fabric to edit; leave out for the "new fabric" form. */
  readonly id?: string;
}

/**
 * Shows the form for a new fabric, or loads the list and shows the form of the fabric with this id.
 *
 * @param props - The fabric id, or none.
 * @returns The screen.
 */
export function AdminFabricEditScreen({ id }: Readonly<AdminFabricEditScreenProps>): ReactElement {
  const t = useTranslations("admin.fabrics");
  const query = useAdminFabrics();
  if (id === undefined) return <Editor />;
  const fabric = query.data?.find((f) => f.id === id);
  return (
    <DataState
      isPending={query.isPending}
      error={query.error}
      isEmpty={fabric === undefined}
      emptyTitle={t("missing.title")}
      emptyDescription={t("missing.description")}
      emptyAction={
        <Link href="/admin/fabrics" className="font-semibold text-primary underline">
          {t("missing.back")}
        </Link>
      }
      onRetry={() => void query.refetch()}
    >
      {fabric ? <Editor key={fabric.id} fabric={fabric} /> : null}
    </DataState>
  );
}
