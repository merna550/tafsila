/** The reset notice of the editor: names the features the rules changed, with undo and close. */
import type { FeaturePath } from "@tafsila/engine/spec-rules";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { AppLocale } from "@/shared/i18n";
import { joinNames, pathMessageKey } from "../model/spec-path";
import { ResetNotice } from "./ResetNotice";

/** Props for {@link EditorNotice}. */
interface EditorNoticeProps {
  /** Features the rules changed on the last choice; nothing is shown when empty. */
  readonly paths: readonly FeaturePath[];
  /** Restores the previous design. */
  readonly onUndo: () => void;
  /** Hides the notice. */
  readonly onDismiss: () => void;
}

/**
 * Renders the notice with the translated feature names.
 *
 * @param props - Changed features and handlers.
 * @returns The notice, or null.
 */
export function EditorNotice({ paths, onUndo, onDismiss }: Readonly<EditorNoticeProps>): ReactElement | null {
  const t = useTranslations("designPicker");
  const locale = useLocale() as AppLocale;
  if (paths.length === 0) return null;
  const features = joinNames(
    paths.map((path) => t(`paths.${pathMessageKey(path)}`)),
    locale,
  );
  return (
    <ResetNotice
      message={t("notice.reset", { features })}
      undoLabel={t("undo")}
      dismissLabel={t("notice.dismiss")}
      onUndo={onUndo}
      onDismiss={onDismiss}
    />
  );
}
