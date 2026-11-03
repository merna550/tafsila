/** One analysed feature: its name, the AI's value with a tag and confidence, the AI note, and confirm and change actions (FR-DES-03, FR-DES-04). */
import { Badge, Button, CheckIcon } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import { ConfidenceBadge } from "./ConfidenceBadge";

/** Props for {@link FeatureCard}. */
interface FeatureCardProps {
  /** Feature name (already translated). */
  readonly title: string;
  /** Current value (already translated). */
  readonly valueLabel: string;
  /** The AI's confidence, when it gave one. */
  readonly confidence: number | undefined;
  /** True while the user must still confirm this feature. */
  readonly needsConfirm: boolean;
  /** True when the value is still the AI's; false once the user changed it. */
  readonly fromAi: boolean;
  /** The AI's note for this feature, in the user's language. */
  readonly note?: string;
  /** True while the choice cards are open. */
  readonly editing: boolean;
  /** Presses "Looks right". */
  readonly onConfirm: () => void;
  /** Opens or closes the choice cards. */
  readonly onToggleEdit: () => void;
  /** The choice cards, shown when `editing`. */
  readonly children?: ReactNode;
}

/**
 * Renders the card; a feature waiting for confirmation is outlined and says so in words.
 *
 * @param props - The feature, its value, state and handlers.
 * @returns The card.
 */
export function FeatureCard(props: Readonly<FeatureCardProps>): ReactElement {
  const t = useTranslations("confirmDesign.card");
  const { needsConfirm, editing } = props;
  return (
    <li
      data-testid="feature-card"
      data-state={needsConfirm ? "needs-confirm" : "confirmed"}
      className={`flex flex-col gap-3 rounded-lg border bg-surface p-4 ${needsConfirm ? "border-danger" : "border-border"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm text-muted">{props.title}</span>
          <span className="text-lg font-bold">{props.valueLabel}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {props.fromAi ? <Badge tone="info">{t("ai")}</Badge> : null}
          {props.confidence === undefined ? null : <ConfidenceBadge value={props.confidence} />}
          {needsConfirm ? (
            <Button onClick={props.onConfirm}>{t("confirm")}</Button>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-success">
              <CheckIcon className="size-4" />
              {t("confirmed")}
            </span>
          )}
          <Button variant="secondary" aria-expanded={editing} onClick={props.onToggleEdit}>
            {editing ? t("close") : t("change")}
          </Button>
        </div>
      </div>
      {needsConfirm ? (
        <p role="note" className="m-0 text-sm font-semibold text-danger">
          {t("needsConfirm")}
        </p>
      ) : null}
      {props.note === undefined ? null : <p className="m-0 text-sm text-muted">{props.note}</p>}
      {editing ? props.children : null}
    </li>
  );
}
