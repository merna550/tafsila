/** Presentation of the "Why these fabrics?" block: the button, the writing state, the text and the unavailable state (FabricExplain screen, FR-REC-04). */
import { Badge, Button, Card, Skeleton, Spinner } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** Props of {@link ExplainView}. */
export interface ExplainViewProps {
  /** Which state to show. */
  readonly status: "idle" | "loading" | "ready" | "failed";
  /** The paragraph, in `ready`. */
  readonly text?: string;
  /** Asks for the explanation (`idle`). */
  readonly onAsk: () => void;
  /** Asks again (`failed`). */
  readonly onRetry: () => void;
}

/**
 * Renders the block for one state.
 *
 * @param props - The state, the text and the actions.
 * @returns The block.
 */
export function ExplainView({ status, text, onAsk, onRetry }: Readonly<ExplainViewProps>): ReactElement {
  const t = useTranslations("fabric.explain");
  return (
    <Card title={t("title")} aria-label={t("title")} data-testid="fabric-explain" data-status={status}>
      {status === "idle" ? (
        <div>
          <Button variant="secondary" onClick={onAsk}>
            {t("ask")}
          </Button>
        </div>
      ) : null}
      {status === "loading" ? (
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2.5 text-muted">
            <Spinner label={t("loading")} />
            {t("loading")}
          </span>
          <Skeleton variant="line" />
          <Skeleton variant="line" className="w-2/3" />
        </div>
      ) : null}
      {status === "ready" ? (
        <div className="flex flex-col gap-3">
          <p className="text-lg leading-8" data-testid="fabric-explain-text">
            {text}
          </p>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <Badge tone="neutral">{t("aiBadge")}</Badge>
            {t("note")}
          </p>
        </div>
      ) : null}
      {status === "failed" ? (
        <div className="flex flex-col gap-3">
          <p className="text-muted" role="alert">
            {t("unavailable")}
          </p>
          <div>
            <Button variant="secondary" onClick={onRetry}>
              {t("retry")}
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
