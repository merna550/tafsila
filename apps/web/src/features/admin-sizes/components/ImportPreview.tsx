/** The preview of a CSV file: every problem with its line, or the sizes found. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { CsvImport, CsvProblem } from "../model/size-chart-csv";

/** A translate function with free keys (the keys are built from the problem kind). */
type Translate = (key: string, values?: Record<string, string | number>) => string;

/**
 * Describes one problem of the file as a sentence.
 *
 * @param problem - The problem.
 * @param t - Translator of `admin.sizes.import.problems`.
 * @param field - Translates a measurement to its label.
 * @returns The sentence.
 */
function describeProblem(problem: CsvProblem, t: Translate, field: (key: string) => string): string {
  switch (problem.kind) {
    case "empty":
    case "header":
    case "noSizes":
      return t(problem.kind);
    case "duplicateSize":
      return t("duplicateSize", { size: problem.size });
    case "unknownRow":
    case "duplicateRow":
      return t(problem.kind, { line: problem.line, key: problem.key });
    case "missingRow":
      return t("missingRow", { field: field(problem.field) });
    case "cell":
      return t(`cell.${problem.error}`, {
        line: problem.line,
        size: problem.size,
        field: field(problem.field),
      });
    case "engine":
      return `${problem.size}: ${problem.text}`;
  }
}

/** Props for {@link ImportPreview}. */
interface ImportPreviewProps {
  /** What reading the file found. */
  readonly result: CsvImport;
}

/**
 * Renders the problems (announced to screen readers) or the "file is fine" line.
 *
 * @param props - The reading result.
 * @returns The preview.
 */
export function ImportPreview({ result }: Readonly<ImportPreviewProps>): ReactElement {
  const t = useTranslations("admin.sizes.import");
  const problemsT = useTranslations("admin.sizes.import.problems");
  const labels = useTranslations("measurements.labels");
  if (result.problems.length === 0) {
    return (
      <p role="status" className="m-0 text-base text-success">
        {t("ready", { sizes: result.sizes.join(", ") })}
      </p>
    );
  }
  return (
    <div role="status" className="flex flex-col gap-2 text-base">
      <p className="m-0 font-semibold text-danger">{t("problemsTitle", { count: result.problems.length })}</p>
      <ul className="m-0 max-h-48 list-none overflow-y-auto p-0 text-danger">
        {result.problems.map((problem, index) => (
          <li key={`${problem.kind}-${index}`}>
            {describeProblem(problem, problemsT as Translate, labels as (key: string) => string)}
          </li>
        ))}
      </ul>
    </div>
  );
}
