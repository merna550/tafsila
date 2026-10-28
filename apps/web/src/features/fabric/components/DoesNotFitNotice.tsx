/** Names the pieces that are wider than the fabric and offers the open layout when it would hold them (FR-FAB-03). */
import { Button } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { FabricDoesNotFit } from "@/shared/fabric-nesting";
import { formatCm } from "../model/format";
import type { TextLocale } from "../model/localized";

/** Props of {@link DoesNotFitNotice}. */
interface DoesNotFitNoticeProps {
  /** The pieces that do not fit. */
  readonly items: readonly FabricDoesNotFit[];
  /** True when the open layout is on offer: the layout is folded and the open one would fit. */
  readonly canTryOpen: boolean;
  /** Called by "Try the open layout". */
  readonly onTryOpen: () => void;
}

/**
 * Renders the warning with one line per piece.
 *
 * @param props - The pieces and the open-layout action.
 * @returns The notice.
 */
export function DoesNotFitNotice({
  items,
  canTryOpen,
  onTryOpen,
}: Readonly<DoesNotFitNoticeProps>): ReactElement {
  const t = useTranslations("fabric.calc.notFit");
  const locale = useLocale() as TextLocale;
  return (
    <div role="alert" className="flex flex-col gap-2 rounded-lg border border-danger bg-surface p-4">
      {items.map((item) => (
        <p key={`${item.fabric}-${item.pieceId}`} className="font-semibold text-danger">
          {t("title", { piece: item.name[locale], usable: formatCm(item.usableWidthMm) })}
        </p>
      ))}
      <p>{t("hint")}</p>
      {canTryOpen ? (
        <div>
          <Button variant="secondary" onClick={onTryOpen}>
            {t("tryOpen")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
