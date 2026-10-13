/** The danger card of the settings screen: what deletion does and the button that opens the confirmation dialog. */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** Props for {@link DeleteAccountCard}. */
interface DeleteAccountCardProps {
  /** Opens the confirmation dialog. */
  readonly onOpen: () => void;
}

/**
 * Renders the danger card.
 *
 * @param props - The open handler.
 * @returns The card.
 */
export function DeleteAccountCard({ onOpen }: Readonly<DeleteAccountCardProps>): ReactElement {
  const t = useTranslations("deleteAccount");
  return (
    <section
      aria-labelledby="settings-delete"
      className="flex flex-col gap-3 rounded-lg border border-danger bg-surface p-6"
    >
      <h2 id="settings-delete" className="text-xl font-semibold text-danger">
        {t("title")}
      </h2>
      <p className="text-lg text-text">{t("description")}</p>
      <div>
        <Button variant="dangerOutline" onClick={onOpen}>
          {t("open")}
        </Button>
      </div>
    </section>
  );
}
