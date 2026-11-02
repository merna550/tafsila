/**
 * The fabric explanation (issue #346, FR-REC-04): a short paragraph on why the recommended fabrics suit the design,
 * written only from the rules' output. The model may not add a fabric or a claim; a post-check enforces it.
 */
import type { BilingualText, DesignSpec } from "@tafsila/schemas";
import { generateText, type LanguageModelUsage, type ModelMessage } from "ai";
import { AiOutputInvalidError } from "./errors";
import { explanationProblems, type NamedFabric } from "./explain-check";
import { explainSystemPrompt } from "./prompts";
import { modelId, resolveModel, type AiDeps } from "./provider";
import { buildUsage, type AiUsage } from "./usage";

/** A recommended or avoided fabric with the rule's reason. */
export interface ExplainedFabric extends NamedFabric {
  /** Why the rules chose or excluded it. */
  readonly reason: BilingualText;
}

/** Input of `explainRecommendations`. */
export interface ExplainRecommendationsInput {
  /** The design the fabrics were chosen for. */
  readonly spec: DesignSpec;
  /** The recommended fabrics, best first. */
  readonly recommended: readonly ExplainedFabric[];
  /** The fabrics to avoid. */
  readonly avoid: readonly ExplainedFabric[];
  /** Every catalogue fabric, for the check that no other fabric is named. */
  readonly catalogue: readonly NamedFabric[];
  /** Language of the paragraph. */
  readonly locale: "ar" | "en";
}

/** Output of `explainRecommendations`. */
export interface ExplainRecommendationsOutput {
  /** The paragraph. */
  readonly text: string;
  /** Tokens, model, latency and cost. */
  readonly usage: AiUsage;
}

/**
 * One fabric as a prompt line: `- id | Arabic | English | reason`.
 *
 * @param fabric - The fabric.
 * @param locale - Language of the reason.
 * @returns The line.
 */
function fabricLine(fabric: ExplainedFabric, locale: "ar" | "en"): string {
  return `- ${fabric.id} | ${fabric.nameAr} | ${fabric.nameEn} | ${fabric.reason[locale]}`;
}

/**
 * The user message: the design, the language and every fabric with its reason.
 *
 * @param input - The request.
 * @returns The message.
 */
export function explainPrompt(input: ExplainRecommendationsInput): string {
  const { locale } = input;
  const avoid =
    input.avoid.length > 0
      ? `Fabrics to avoid:\n${input.avoid.map((f) => fabricLine(f, locale)).join("\n")}`
      : "";
  return [
    `Design: ${JSON.stringify(input.spec)}`,
    `Language: ${locale}`,
    `Recommended fabrics:\n${input.recommended.map((f) => fabricLine(f, locale)).join("\n")}`,
    avoid,
  ]
    .filter((part) => part.length > 0)
    .join("\n\n");
}

/** One model attempt and what is wrong with it. */
interface ExplainAttempt {
  /** The model's text. */
  readonly text: string;
  /** What to tell the model on a retry; empty when the text is good. */
  readonly problems: readonly string[];
  /** Token usage. */
  readonly usage: LanguageModelUsage;
}

/**
 * Asks the model once and checks the text.
 *
 * @param deps - The dependencies.
 * @param input - The request.
 * @param messages - The conversation so far.
 * @returns The attempt.
 */
async function attempt(
  deps: AiDeps,
  input: ExplainRecommendationsInput,
  messages: ModelMessage[],
): Promise<ExplainAttempt> {
  const answer = await generateText({
    model: resolveModel(deps, "explain"),
    system: explainSystemPrompt(),
    messages,
    temperature: 0,
  });
  const text = answer.text.trim();
  const allowed = [...input.recommended, ...input.avoid];
  return { text, problems: explanationProblems(text, allowed, input.catalogue), usage: answer.usage };
}

/**
 * Explains why the recommended fabrics suit the design. A text that names a fabric outside the input, or runs over 70
 * words, is retried once with the problem; a second bad text throws.
 *
 * @param input - The design, the recommendation and the language.
 * @param deps - Configuration (and a test model).
 * @returns The paragraph and the usage.
 * @throws {AiOutputInvalidError} When both texts fail the check; the error carries the usage of both attempts.
 * @example
 * const { text } = await explainRecommendations(input, createFakeAi());
 */
export async function explainRecommendations(
  input: ExplainRecommendationsInput,
  deps: AiDeps,
): Promise<ExplainRecommendationsOutput> {
  const now = deps.now ?? (() => performance.now());
  const started = now();
  const messages: ModelMessage[] = [{ role: "user", content: explainPrompt(input) }];
  const first = await attempt(deps, input, messages);
  const attempts = [first];
  if (first.problems.length > 0) {
    const correction = `That text is not allowed: ${first.problems.join("; ")}. Write it again.`;
    attempts.push(
      await attempt(deps, input, [
        ...messages,
        { role: "assistant", content: first.text || "(no answer)" },
        { role: "user", content: correction },
      ]),
    );
  }
  const final = attempts.at(-1)!;
  const usage = buildUsage(
    deps.config.provider,
    modelId(deps.config, "explain"),
    attempts.map((a) => a.usage),
    now() - started,
  );
  if (final.problems.length > 0) {
    throw new AiOutputInvalidError("explainRecommendations", final.problems.join("; "), usage);
  }
  return { text: final.text, usage };
}
