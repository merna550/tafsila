"use client";
/** The badge beside the title: saved, unsaved, updating, outdated, failed. */
import { Badge, type BadgeTone } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { SaveState } from "../model/save-state";

/** Message keys of `patternPage.status`. */
type StatusKey =
  "saved" | "unsaved" | "updating" | "outdated" | "fail" | "error" | "noSet" | "rejected" | "saving";

/** Message key and tone per state. */
const BADGES: Record<SaveState["kind"], { key: StatusKey; tone: BadgeTone } | null> = {
  loading: null,
  "no-set": { key: "noSet", tone: "neutral" },
  previewing: { key: "updating", tone: "neutral" },
  "preview-error": { key: "error", tone: "danger" },
  "server-rejected": { key: "rejected", tone: "danger" },
  fail: { key: "fail", tone: "danger" },
  saving: { key: "saving", tone: "neutral" },
  saved: { key: "saved", tone: "success" },
  outdated: { key: "outdated", tone: "warning" },
  unsaved: { key: "unsaved", tone: "warning" },
};

/**
 * Renders the status of the pattern against its saved version.
 *
 * @param props - Component props.
 * @param props.state - The save state.
 * @returns The badge, or nothing while loading.
 */
export function SaveStatusBadge({ state }: Readonly<{ state: SaveState }>): ReactElement | null {
  const t = useTranslations("patternPage.status");
  const badge = BADGES[state.kind];
  if (badge === null) return null;
  return (
    <Badge tone={badge.tone} data-testid="save-status" data-kind={state.kind}>
      {t(badge.key, { n: state.versionNo ?? 0 })}
    </Badge>
  );
}
