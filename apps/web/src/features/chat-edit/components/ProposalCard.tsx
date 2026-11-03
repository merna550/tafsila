/** The card of a valid proposal: the change lines, then Apply and Cancel (FR-CHAT-03). */
import { Badge, Button, Card } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";
import type { ApplyState } from "../model/apply-state";
import type { ProposalItem } from "../model/chat-view";

/** Props of {@link ProposalCard}. */
interface ProposalCardProps {
  /** The proposal. */
  readonly item: ProposalItem;
  /** Its state. */
  readonly state: ApplyState;
  /** True when the user hid it. */
  readonly dismissed: boolean;
  /** The design (for the history link). */
  readonly designId: string;
  /** Applies it. */
  readonly onApply: () => void;
  /** Hides it. */
  readonly onCancel: () => void;
  /** Sends the original request again on the current version. */
  readonly onAskAgain: () => void;
  /** True when a message is on its way (blocks "ask again"). */
  readonly busy: boolean;
}

/**
 * Renders the status line under the change lines.
 *
 * @param props - Component props.
 * @returns The footer.
 */
function Footer(props: Readonly<ProposalCardProps>): ReactElement | null {
  const t = useTranslations("chatEdit.proposal");
  const { state, dismissed } = props;
  if (state.kind === "applied") {
    return (
      <p className="text-sm" data-testid="chat-applied">
        {state.versionNo === null ? t("appliedGeneric") : t("applied", { n: state.versionNo })}{" "}
        <Link href={`/designs/${props.designId}/versions`} className="font-semibold text-primary underline">
          {t("viewHistory")}
        </Link>
      </p>
    );
  }
  if (state.kind === "stale") {
    return (
      <div className="flex flex-col gap-2" data-testid="chat-stale">
        <p className="text-sm text-warning">{t("stale")}</p>
        <Button variant="secondary" disabled={props.busy} onClick={props.onAskAgain}>
          {t("askAgain")}
        </Button>
      </div>
    );
  }
  if (dismissed) return <p className="text-sm text-muted">{t("dismissed")}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      <Button disabled={state.kind === "applying"} onClick={props.onApply} data-testid="chat-apply">
        {state.kind === "applying" ? t("applying") : t("apply")}
      </Button>
      <Button variant="secondary" disabled={state.kind === "applying"} onClick={props.onCancel}>
        {t("cancel")}
      </Button>
    </div>
  );
}

/**
 * Renders a proposal with its change lines; nothing changes the pattern until Apply is pressed.
 *
 * @param props - The proposal, its state and the handlers.
 * @returns The card.
 */
export function ProposalCard(props: Readonly<ProposalCardProps>): ReactElement {
  const t = useTranslations("chatEdit.proposal");
  return (
    <Card className="flex flex-col gap-3 p-3" data-testid="chat-proposal">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{t("title")}</span>
        <Badge tone="success">{t("valid")}</Badge>
      </div>
      <ul className="flex list-disc flex-col gap-1 ps-5 text-sm">
        {props.item.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <Footer {...props} />
    </Card>
  );
}
