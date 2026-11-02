"use client";
/** The /designs/new/photos screen: choose the garment, add 1 to 3 photos and start the analysis (FR-DES-01, FR-DES-02). */
import { PageHeader } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import { CategoryChoiceGroup } from "./components/CategoryChoiceGroup";
import { PhotoBreadcrumb } from "./components/PhotoBreadcrumb";
import { PhotoPicker } from "./components/PhotoPicker";
import { StartPanel } from "./components/StartPanel";
import { TipsCard } from "./components/TipsCard";
import { usePhotoSlots } from "./hooks/use-photo-slots";
import { useStartAnalysis } from "./hooks/use-start-analysis";
import { isAvailable, type CategoryChoice } from "./model/category-choice";
import { canStartAnalysis } from "./model/photo-rules";

/**
 * Shows the photo step and starts the analysis.
 *
 * @returns The screen.
 */
export function PhotoStepScreen(): ReactElement {
  const t = useTranslations("uploadDesign");
  const [choice, setChoice] = useState<CategoryChoice>("auto");
  const slots = usePhotoSlots();
  const control = useStartAnalysis(slots);
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PhotoBreadcrumb current={t("current")} />
      <PageHeader title={t("title")} />
      <CategoryChoiceGroup value={choice} disabled={control.running} onChange={setChoice} />
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="flex min-w-0 flex-col gap-3.5 lg:col-span-2">
          <PhotoPicker
            items={slots.items}
            previews={slots.previews}
            notice={slots.notice}
            disabled={control.running}
            onAdd={slots.addFiles}
            onRemove={slots.remove}
          />
          <StartPanel
            empty={slots.items.length === 0}
            enabled={canStartAnalysis(slots.items) && isAvailable(choice)}
            running={control.running}
            onStart={() => void control.start(choice)}
          />
        </section>
        <aside className="min-w-0">
          <TipsCard />
        </aside>
      </div>
    </div>
  );
}
