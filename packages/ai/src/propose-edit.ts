/**
 * Chat edits (issue #337, FR-CHAT-02, FR-CHAT-04): a message in, a `SpecPatch` out through tool calls, checked by
 * `applySpecPatch`. The model proposes; the engine's rules decide.
 */
import { applySpecPatch, type ApplySpecPatchResult } from "@tafsila/engine/spec-rules";
import {
  designFeaturePathSchema,
  designLengthPathSchema,
  pocketStyleSchema,
  specPatchOpSchema,
  unsupportedRequestSchema,
  type DesignSpec,
  type SpecPatch,
  type SpecPatchOp,
} from "@tafsila/schemas";
import { generateText, tool, type LanguageModelUsage, type ModelMessage, type ToolSet } from "ai";
import { z } from "zod";
import { REQUEST_MARKER } from "./fake-model";
import { chatSystemPrompt } from "./prompts";
import { modelId, resolveModel, type AiDeps } from "./provider";
import { buildUsage, type AiUsage } from "./usage";

/** One earlier turn of the chat. */
export interface ChatTurn {
  /** Who wrote it. */
  readonly role: "user" | "assistant";
  /** What was written. */
  readonly text: string;
}

/** Input of `proposeEdit`. */
export interface ProposeEditInput {
  /** The current design. */
  readonly spec: DesignSpec;
  /** The user's request. */
  readonly message: string;
  /** Earlier turns, oldest first. */
  readonly history?: readonly ChatTurn[];
}

/** Output of `proposeEdit`. */
export interface ProposeEditOutput {
  /** The proposed changes; `ops` is empty when nothing can be applied. */
  readonly patch: SpecPatch;
  /** The patch applied to the design: the new spec and its changes, or why it is refused. */
  readonly outcome: ApplySpecPatchResult;
  /** Tokens, model, latency and cost. */
  readonly usage: AiUsage;
}

/** The chat tools: their inputs are the patch ops (decision 337). */
const CHAT_TOOLS = {
  setFeature: tool({
    description: "Set one feature of the design to one of its allowed values.",
    inputSchema: z.object({ path: designFeaturePathSchema, value: z.union([z.string(), z.boolean()]) }),
  }),
  setLength: tool({
    description: "Set one optional length of the design, in millimetres.",
    inputSchema: z.object({ path: designLengthPathSchema, mm: z.number().positive() }),
  }),
  addPocket: tool({ description: "Add a pocket style.", inputSchema: z.object({ type: pocketStyleSchema }) }),
  removePocket: tool({
    description: "Remove a pocket style.",
    inputSchema: z.object({ type: pocketStyleSchema }),
  }),
  explainUnsupported: tool({
    description: "Explain a request the tools cannot do, with the closest supported change when one exists.",
    inputSchema: unsupportedRequestSchema,
  }),
} satisfies ToolSet;

/** Shown when the model's changes were refused twice. */
const NOT_APPLIED: SpecPatch["unsupported"] = {
  text: {
    ar: "لم أستطع تطبيق هذا التعديل على التصميم. جرّبي صياغة أخرى أو غيّري الميزة من المحرّر.",
    en: "I could not apply this change to the design. Try other words or change the feature in the editor.",
  },
};

/** The patch op each change tool produces; its input is the op's other fields. */
const TOOL_OPS: Readonly<Record<string, SpecPatchOp["op"]>> = {
  setFeature: "set",
  setLength: "setLength",
  addPocket: "addPocket",
  removePocket: "removePocket",
};

/** A tool call as the SDK returns it. */
interface ToolCallLike {
  /** Tool name. */
  readonly toolName: string;
  /** Parsed input. */
  readonly input: unknown;
  /** True when the input failed the tool's schema. */
  readonly invalid?: boolean;
}

/**
 * Turns one valid tool call into a patch op.
 *
 * @param call - The tool call.
 * @returns The op, or undefined for `explainUnsupported`.
 */
function toOp(call: ToolCallLike): SpecPatchOp | undefined {
  const op = TOOL_OPS[call.toolName];
  return op === undefined ? undefined : specPatchOpSchema.parse({ ...(call.input as object), op });
}

/**
 * Collects tool calls into a patch.
 *
 * @param calls - The tool calls of one answer.
 * @returns The patch, and the invalid calls as error text.
 */
export function collectPatch(calls: readonly ToolCallLike[]): { patch: SpecPatch; invalid: string[] } {
  const valid = calls.filter((call) => !call.invalid);
  const invalid = calls
    .filter((call) => call.invalid)
    .map((call) => `${call.toolName}(${JSON.stringify(call.input)})`);
  const ops = valid.map(toOp).filter((op): op is SpecPatchOp => op !== undefined);
  const explained = valid.find((call) => call.toolName === "explainUnsupported");
  const unsupported = explained ? unsupportedRequestSchema.parse(explained.input) : undefined;
  return { patch: unsupported ? { ops, unsupported } : { ops }, invalid };
}

/** One model attempt and what came of it. */
interface EditAttempt {
  /** The collected patch. */
  readonly patch: SpecPatch;
  /** The patch applied to the design. */
  readonly outcome: ApplySpecPatchResult;
  /** What to tell the model on a retry; empty when the attempt is good. */
  readonly errors: readonly string[];
  /** Token usage. */
  readonly usage: LanguageModelUsage;
}

/**
 * Asks the model once and checks its tool calls.
 *
 * @param deps - The dependencies.
 * @param spec - The current design.
 * @param messages - The conversation so far.
 * @returns The attempt.
 */
async function attempt(deps: AiDeps, spec: DesignSpec, messages: ModelMessage[]): Promise<EditAttempt> {
  const answer = await generateText({
    model: resolveModel(deps, "chat"),
    system: chatSystemPrompt(),
    messages,
    temperature: 0,
    tools: CHAT_TOOLS,
  });
  const { patch, invalid } = collectPatch(answer.toolCalls);
  const outcome = applySpecPatch(spec, patch);
  const refused = outcome.ok
    ? []
    : outcome.issues.map((issue) => `${issue.code} ${issue.path ?? ""}: ${issue.message}`);
  return {
    patch,
    outcome,
    errors: [...invalid.map((call) => `invalid tool call ${call}`), ...refused],
    usage: answer.usage,
  };
}

/**
 * The conversation sent to the model: history, then the design and the request.
 *
 * @param input - The request.
 * @returns The messages.
 */
function chatMessages(input: ProposeEditInput): ModelMessage[] {
  const history = (input.history ?? []).map((turn): ModelMessage => ({
    role: turn.role,
    content: turn.text,
  }));
  return [
    ...history,
    {
      role: "user",
      content: `Current design: ${JSON.stringify(input.spec)}\n${REQUEST_MARKER} ${input.message}`,
    },
  ];
}

/**
 * Proposes the changes a chat message asks for. A patch the engine refuses (or an invalid tool call) is retried once
 * with the reasons; a second failure is returned as unsupported with no ops, never thrown.
 *
 * @param input - The design, the message and the history.
 * @param deps - Configuration (and a test model).
 * @returns The patch, its outcome on the design and the usage.
 * @example
 * const { patch } = await proposeEdit({ spec, message: "add side pockets" }, createFakeAi());
 */
export async function proposeEdit(input: ProposeEditInput, deps: AiDeps): Promise<ProposeEditOutput> {
  const now = deps.now ?? (() => performance.now());
  const started = now();
  const messages = chatMessages(input);
  const first = await attempt(deps, input.spec, messages);
  const attempts = [first];
  if (first.errors.length > 0) {
    const correction = `Those changes were refused: ${first.errors.join("; ")}. Propose valid changes or explain why not.`;
    attempts.push(await attempt(deps, input.spec, [...messages, { role: "user", content: correction }]));
  }
  const final = attempts.at(-1)!;
  const usage = buildUsage(
    deps.config.provider,
    modelId(deps.config, "chat"),
    attempts.map((a) => a.usage),
    now() - started,
  );
  if (final.errors.length === 0) return { patch: final.patch, outcome: final.outcome, usage };
  const patch: SpecPatch = { ops: [], unsupported: NOT_APPLIED };
  return { patch, outcome: applySpecPatch(input.spec, patch), usage };
}
