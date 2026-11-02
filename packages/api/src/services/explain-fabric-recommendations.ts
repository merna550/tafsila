/** Use case: add the AI explanation to the fabric recommendations of a version (FR-REC-04, NFR-04, ADR-335 item 8). The text comes only from the rules' output; a cached text costs nothing. */
import { explainRecommendations, AiOutputInvalidError, type AiDeps, type AiUsage } from "@tafsila/ai";
import type { FabricExplanation, RecommendFabricsResponse } from "@tafsila/schemas";
import { hashRecommendation } from "../domain/recommendation-hash";
import { AppError } from "../domain/errors";
import type { AiUsageRepository } from "../ports/ai-usage-repository";
import type { Clock } from "../ports/clock";
import type { ErrorReporter } from "../ports/error-reporter";
import type { FabricExplanationRepository } from "../ports/fabric-explanation-repository";
import type { AuthContext } from "../ports/token-verifier";
import { failedAiUsage, recordAiUsage } from "./ai-usage-shared";
import {
  loadRecommendation,
  type GetFabricRecommendationsDeps,
  type LoadedRecommendation,
} from "./get-fabric-recommendations";

/** Ports and limits the use case needs. */
export interface ExplainFabricRecommendationsDeps extends GetFabricRecommendationsDeps {
  readonly fabricExplanations: FabricExplanationRepository;
  readonly aiUsage: AiUsageRepository;
  readonly errorReporter: ErrorReporter;
  readonly clock: Clock;
  /** The AI configuration, read per request so a bad one fails the request, not the app. */
  readonly aiDeps: () => AiDeps;
  /** New explanations a user may ask for per UTC day. */
  readonly explainDailyLimit: number;
}

/**
 * Writes the explanation with the AI, logging the call also when it fails (a failed call may still cost).
 *
 * @param deps - Ports and AI configuration.
 * @param ctx - Verified caller.
 * @param loaded - The recommendation, its version and the catalogue.
 * @param locale - Language of the text.
 * @returns The text.
 * @throws {AppError} AI_EXPLAIN_FAILED when the provider fails or its text breaks the rules twice.
 */
async function write(
  deps: ExplainFabricRecommendationsDeps,
  ctx: AuthContext,
  loaded: LoadedRecommendation,
  locale: FabricExplanation["locale"],
): Promise<string> {
  const { response, version, catalogue } = loaded;
  const subject = { kind: "explain", userId: ctx.userId, designId: version.designId } as const;
  const began = deps.clock.now().getTime();
  let ai: AiDeps | undefined;
  let usage: AiUsage | undefined;
  try {
    ai = deps.aiDeps();
    const output = await explainRecommendations(
      {
        spec: version.spec,
        recommended: response.recommended.map((r) => ({ ...r.fabric, reason: r.reason })),
        avoid: response.avoid.map((r) => ({ ...r.fabric, reason: r.reason })),
        catalogue,
        locale,
      },
      ai,
    );
    usage = output.usage;
    await recordAiUsage(deps.aiUsage, subject, usage);
    return output.text;
  } catch (error) {
    if (usage) throw error;
    deps.errorReporter.captureException(error, { requestId: `explain:${version.id}` });
    if (ai) {
      const spent = error instanceof AiOutputInvalidError ? error.usage : undefined;
      const failed = spent ?? failedAiUsage(ai, deps.clock.now().getTime() - began);
      await recordAiUsage(deps.aiUsage, subject, failed);
    }
    throw new AppError("AI_EXPLAIN_FAILED");
  }
}

/**
 * Returns the recommendation with its explanation: the cached text for this version, language and catalogue state, or
 * a new one (checked against the daily cap, written by the AI, cached, logged in `ai_usage`). With no recommended
 * fabric there is nothing to explain and the recommendation is returned as it is.
 *
 * @param deps - Ports, AI configuration and the cap.
 * @param ctx - Verified caller.
 * @param versionId - Version id.
 * @param locale - Language of the text.
 * @returns The recommendation plus `explanation`.
 * @throws {NotFoundError} When the version is missing or not the caller's.
 * @throws {AppError} EXPLAIN_DAILY_LIMIT or AI_EXPLAIN_FAILED.
 */
export async function explainFabricRecommendations(
  deps: ExplainFabricRecommendationsDeps,
  ctx: AuthContext,
  versionId: string,
  locale: FabricExplanation["locale"],
): Promise<RecommendFabricsResponse> {
  const loaded = await loadRecommendation(deps, ctx, versionId);
  const { response } = loaded;
  if (response.recommended.length === 0) return response;
  const catalogueHash = hashRecommendation(response);
  const cached = await deps.fabricExplanations.find(ctx, versionId, locale, catalogueHash);
  if (cached) return { ...response, explanation: cached };
  if ((await deps.aiUsage.countToday(ctx.userId, "explain", deps.clock.now())) >= deps.explainDailyLimit) {
    throw new AppError("EXPLAIN_DAILY_LIMIT");
  }
  const text = await write(deps, ctx, loaded, locale);
  await deps.fabricExplanations.save(ctx, { versionId, locale, catalogueHash, text });
  return { ...response, explanation: { text, locale } };
}
