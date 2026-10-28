/** The preview box: picks a fixture design and shows the recommendations the edited rule would give, next to the saved ones. */
import type { FabricRecommendationResult } from "@tafsila/schemas";
import { Select } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { PREVIEW_DESIGNS } from "../model/preview-designs";
import type { RulePreview } from "../model/preview";

/** Props of {@link PreviewBox}. */
interface PreviewBoxProps {
  /** Key of the picked design. */
  readonly designKey: string;
  /** Called with a new design key. */
  readonly onDesignChange: (key: string) => void;
  /** The preview, or undefined while the edited rule is not valid yet. */
  readonly preview: RulePreview | undefined;
  /** Shows a fabric id as its name in the interface language. */
  readonly nameOf: (fabricId: string) => string;
  /** Page direction. */
  readonly dir: "rtl" | "ltr";
}

/** Props of {@link Outcome}. */
interface OutcomeProps {
  /** Heading of the column. */
  readonly title: string;
  /** The recommendation result. */
  readonly result: FabricRecommendationResult;
  /** Fabric id to name. */
  readonly nameOf: (fabricId: string) => string;
  /** Test id of the list, for e2e. */
  readonly testId: string;
}

/**
 * One column: the ranked fabrics and the avoid list.
 *
 * @param props - Heading, result and name lookup.
 * @returns The column.
 */
function Outcome({ title, result, nameOf, testId }: Readonly<OutcomeProps>): ReactElement {
  const t = useTranslations("admin.fabricRules.preview");
  return (
    <div className="flex flex-1 basis-48 flex-col gap-2" data-testid={testId}>
      <h4 className="text-base font-semibold text-text">{title}</h4>
      <ol className="list-decimal ps-5 text-base text-text">
        {result.recommended.map((r) => (
          <li key={r.fabricId}>{nameOf(r.fabricId)}</li>
        ))}
      </ol>
      {result.avoid.length > 0 ? (
        <p className="text-sm text-muted">
          {t("avoid")} {result.avoid.map((a) => nameOf(a.fabricId)).join("، ")}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Renders the box.
 *
 * @param props - The picked design, the preview and the handlers.
 * @returns The box.
 */
export function PreviewBox({
  designKey,
  onDesignChange,
  preview,
  nameOf,
  dir,
}: Readonly<PreviewBoxProps>): ReactElement {
  const t = useTranslations("admin.fabricRules.preview");
  const options = PREVIEW_DESIGNS.map((d) => ({
    value: d.key,
    label: t(`designs.${d.key}` as "designs.seedDress"),
  }));
  return (
    <section aria-labelledby="preview-title" className="flex flex-col gap-3 rounded-md bg-surface-hover p-3">
      <h3 id="preview-title" className="text-lg font-semibold text-text">
        {t("title")}
      </h3>
      <p className="text-sm text-muted">{t("note")}</p>
      <Select
        dir={dir}
        aria-label={t("design")}
        options={options}
        value={designKey}
        onValueChange={onDesignChange}
      />
      {preview ? (
        <>
          <p role="status" data-testid="preview-verdict" className="text-base font-semibold text-text">
            {preview.changed ? t("changed") : t("unchanged")}
          </p>
          <div className="flex flex-wrap gap-4">
            <Outcome title={t("before")} result={preview.before} nameOf={nameOf} testId="preview-before" />
            <Outcome title={t("after")} result={preview.after} nameOf={nameOf} testId="preview-after" />
          </div>
        </>
      ) : (
        <p className="text-sm text-muted">{t("incomplete")}</p>
      )}
    </section>
  );
}
