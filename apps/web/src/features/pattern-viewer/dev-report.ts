/** Dev-only report fixture: the seed dress report plus one warning and one failure that point at real edges and darts (issue #249). */
import type { ValidationReport } from "@tafsila/schemas";

/**
 * Adds a demo warning (an edge) and a demo failure (a dart and an edge) to a real report, so the host shows the highlight.
 *
 * @param report - The engine's report for the seed dress.
 * @returns The report with the two demo checks first.
 */
export function withDemoChecks(report: ValidationReport): ValidationReport {
  return {
    status: "fail",
    checks: [
      {
        id: "FR-VAL-01",
        code: "DEMO_FAIL",
        status: "fail",
        message: {
          ar: "طول حافة الجنب لا يطابق فتحة الذراع.",
          en: "The side edge does not match the armhole.",
        },
        measuredMm: 244,
        expectedMm: 220,
        refs: ["bodice-front/side", "bodice-front/bust-dart"],
      },
      {
        id: "FR-VAL-08",
        code: "DEMO_WARN",
        status: "warn",
        message: {
          ar: "الراحة عند الورك أقل قليلاً من المعتاد.",
          en: "Ease at the hip is a little below usual.",
        },
        refs: ["skirt-front/side"],
      },
      ...report.checks,
    ],
  };
}
