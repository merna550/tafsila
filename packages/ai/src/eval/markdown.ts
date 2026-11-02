/** The markdown summary of an evaluation report (issue #338): printed after a run and saved next to its JSON. */
import { LOW_CONFIDENCE } from "@tafsila/schemas";
import type { EvalReport } from "./report";
import type { Tally } from "./score";

/** Decimals shown for money. */
const MONEY_DECIMALS = 4;

/** Percent in a whole. */
const PERCENT = 100;

/**
 * A share as a percent.
 *
 * @param share - 0 to 1, or null.
 * @returns Such as `"86.7 %"`, or `"n/a"`.
 */
function percent(share: number | null): string {
  return share === null ? "n/a" : `${(share * PERCENT).toFixed(1)} %`;
}

/**
 * A number, or `"unknown"`.
 *
 * @param value - The number.
 * @param decimals - Decimals to show.
 * @returns The text.
 */
function num(value: number | null, decimals = 0): string {
  return value === null ? "unknown" : value.toFixed(decimals);
}

/**
 * A yes/no check.
 *
 * @param pass - True, false or null.
 * @returns `"yes"`, `"NO"` or `"n/a"`.
 */
function check(pass: boolean | null): string {
  if (pass === null) return "n/a";
  return pass ? "yes" : "NO";
}

/**
 * One table row of a tally.
 *
 * @param name - Row name.
 * @param value - The tally.
 * @returns The markdown row.
 */
function tallyRow(name: string, value: Tally): string {
  return `| ${name} | ${value.correct}/${value.compared} | ${percent(value.accuracy)} |`;
}

/**
 * The header, the overall figures and the stop reason.
 *
 * @param report - The report.
 * @returns Markdown lines.
 */
function headline(report: EvalReport): string[] {
  const { meta, accuracy, photos } = report;
  const stopped = report.stopped
    ? [`Stopped early (${report.stopped.reason}) after ${report.stopped.afterPhotos} photos.`, ""]
    : [];
  return [
    `# AI evaluation: ${meta.provider} / ${meta.model}`,
    "",
    `Started ${meta.startedAt} · ${photos.analysed} photos · ${photos.failed.length} failed · hint ${report.limits.hint ? "on" : "off"}`,
    "",
    ...stopped,
    `**Feature accuracy (micro, the exit figure): ${percent(accuracy.micro.accuracy)}** (${accuracy.micro.correct}/${accuracy.micro.compared}) · macro ${percent(accuracy.macro)}`,
    "",
  ];
}

/**
 * The per-feature table and the confidence check.
 *
 * @param report - The report.
 * @returns Markdown lines.
 */
function accuracyTables(report: EvalReport): string[] {
  const { confidence, unsupported } = report;
  return [
    "## Accuracy per feature",
    "",
    "| Feature | Correct | Accuracy |",
    "| --- | --- | --- |",
    ...report.accuracy.perFeature.filter((row) => row.compared > 0).map((row) => tallyRow(row.path, row)),
    "",
    `## Confidence flag (below ${LOW_CONFIDENCE})`,
    "",
    "| Band | Correct | Accuracy |",
    "| --- | --- | --- |",
    tallyRow(`flagged (< ${LOW_CONFIDENCE})`, confidence.low),
    tallyRow(`sure (≥ ${LOW_CONFIDENCE})`, confidence.high),
    "",
    `Wrong features flagged: ${confidence.wrongFlagged}/${confidence.wrong} (${percent(confidence.flagRecall)}).`,
    `Unsupported items found: ${unsupported.matched}/${unsupported.labelled} (${percent(unsupported.recall)}, not in the accuracy).`,
    "",
  ];
}

/**
 * Latency and cost.
 *
 * @param report - The report.
 * @returns Markdown lines.
 */
function latencyAndCost(report: EvalReport): string[] {
  const { latency, cost, meta } = report;
  return [
    "## Latency and cost",
    "",
    `- p50 ${num(latency.p50Ms)} ms · p95 ${num(latency.p95Ms)} ms · within ${latency.boundMs} ms (NFR-02): ${check(latency.withinBound)}`,
    `- Cost per photo: ${num(cost.perPhotoUsd, MONEY_DECIMALS)} USD = ${num(cost.perPhotoEgp, 2)} EGP at ${meta.usdEgp} EGP/USD · total ${num(cost.totalUsd, MONEY_DECIMALS)} USD`,
    `- Per pattern (+ ${meta.chatAllowanceEgp} EGP chat allowance): ${num(cost.perPatternEgp, 2)} EGP · within ${cost.targetEgp} EGP (SRS §9): ${check(cost.withinTarget)}`,
    "",
  ];
}

/**
 * The confusion list and the failed photos.
 *
 * @param report - The report.
 * @returns Markdown lines.
 */
function mistakes(report: EvalReport): string[] {
  const failed = report.photos.failed.map((photo) => `- ${photo.id}: ${photo.error}`);
  return [
    "## Most common wrong answers",
    "",
    "| Feature | Label | Answer | Count |",
    "| --- | --- | --- | --- |",
    ...report.confusions.map(
      (item) => `| ${item.path} | ${item.expected} | ${item.predicted} | ${item.count} |`,
    ),
    "",
    "## Failed photos",
    "",
    ...(failed.length === 0 ? ["None."] : failed),
    "",
  ];
}

/**
 * The markdown summary of a report.
 *
 * @param report - The report.
 * @returns The summary.
 * @example
 * process.stdout.write(toMarkdown(buildReport(run, limits, meta)));
 */
export function toMarkdown(report: EvalReport): string {
  return [
    ...headline(report),
    ...accuracyTables(report),
    ...latencyAndCost(report),
    ...mistakes(report),
  ].join("\n");
}
