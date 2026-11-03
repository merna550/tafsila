/** The polite "not supported" answer with the closest supported changes as one-click requests (FR-CHAT-04). */
import { Button, Card } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { UnsupportedItem } from "../model/chat-view";

/** Props of {@link UnsupportedCard}. */
interface UnsupportedCardProps {
  /** The answer. */
  readonly item: UnsupportedItem;
  /** Sends a suggestion as a new message. */
  readonly onTry: (text: string) => void;
  /** True when sending is not possible now. */
  readonly disabled: boolean;
}

/**
 * Renders the explanation and a button per suggestion.
 *
 * @param props - The answer and the handler.
 * @returns The card.
 */
export function UnsupportedCard({ item, onTry, disabled }: Readonly<UnsupportedCardProps>): ReactElement {
  const t = useTranslations("chatEdit.unsupported");
  return (
    <Card className="flex flex-col gap-3 p-3" data-testid="chat-unsupported">
      <p className="text-sm font-semibold">{t("title")}</p>
      <p className="text-sm">{item.text}</p>
      {item.closest.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">{t("closest")}</p>
          {item.closest.map((line) => (
            <Button key={line} variant="secondary" disabled={disabled} onClick={() => onTry(line)}>
              {line}
            </Button>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
