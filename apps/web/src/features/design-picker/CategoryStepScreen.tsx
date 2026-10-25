"use client";
/** The /designs/new screen: choose the garment type; the design is created on the choice and the editor opens. */
import type { GarmentCategory } from "@tafsila/schemas";
import { PageHeader } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { useRouter } from "@/shared/i18n";
import { useApiErrorHandler } from "@/shared/error-display";
import { DesignsBreadcrumb } from "./components/DesignsBreadcrumb";
import { CategoryStep } from "./components/CategoryStep";
import { ClientChipSlot } from "./ClientChipSlot";
import { useCreateDesign } from "./hooks/use-create-design";
import { editorHref } from "./model/editor-query";

/** Props for {@link CategoryStepScreen}. */
interface CategoryStepScreenProps {
  /** The client the design is for, from `?clientId=`. */
  readonly clientId?: string;
}

/**
 * Shows the category step and creates the design on the choice.
 *
 * @param props - The optional client.
 * @returns The screen.
 */
export function CategoryStepScreen({ clientId }: Readonly<CategoryStepScreenProps>): ReactElement {
  const t = useTranslations("designPicker");
  const router = useRouter();
  const handleError = useApiErrorHandler();
  const create = useCreateDesign();
  /**
   * Creates the design and opens its editor; a failure shows the shared error toast and keeps the cards.
   *
   * @param category - The chosen garment type.
   */
  const choose = async (category: GarmentCategory): Promise<void> => {
    try {
      const design = await create.mutateAsync(category);
      router.replace(editorHref(design.id, clientId === undefined ? {} : { clientId }));
    } catch (error) {
      handleError(error, "action");
    }
  };
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <DesignsBreadcrumb current={t("newDesign")} />
      <PageHeader title={t("newTitle")} />
      {clientId === undefined ? null : (
        <ClientChipSlot clientId={clientId} onRemove={() => router.replace("/designs/new")} />
      )}
      <CategoryStep onChoose={(category) => void choose(category)} pending={create.isPending} />
    </div>
  );
}
