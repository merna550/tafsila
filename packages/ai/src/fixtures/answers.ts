/**
 * The fake provider's answers (issue #337, decision 337, 2), also reused by API tests and e2e. Designs are the engine's
 * starting designs, so every answer is one the engine accepts and nothing is copied.
 */
import { defaultSpec } from "@tafsila/engine/spec-rules";
import type { DesignAnalysisResult, GarmentCategory, SpecPatchOp } from "@tafsila/schemas";

/**
 * The analysis the fake model returns for a category.
 *
 * @param category - The category hint (a dress when none is given).
 * @returns A valid result with one uncertain feature and its note.
 */
export function fakeAnalysis(category: GarmentCategory = "dress"): DesignAnalysisResult {
  const spec = defaultSpec(category);
  const uncertain = category === "skirt" ? "skirt.type" : "neckline.front";
  return {
    spec,
    category: { value: category, confidence: 0.95 },
    confidence: { category: 0.95, [uncertain]: 0.55 },
    notes: [
      {
        path: uncertain,
        text: {
          ar: "الصورة غير واضحة هنا، راجعي هذه الميزة.",
          en: "The photo is unclear here; please check this feature.",
        },
      },
    ],
    unsupported: [],
  };
}

/** One tool call the fake chat model makes. */
export interface FakeToolCall {
  /** Tool name. */
  readonly toolName: string;
  /** Tool input. */
  readonly input: Record<string, unknown>;
}

/** The fake chat model's answers, first matching keyword wins (English or Arabic). */
export const FAKE_CHAT_ANSWERS: readonly {
  readonly keywords: readonly string[];
  readonly calls: readonly FakeToolCall[];
}[] = [
  {
    keywords: ["jumpsuit", "unsupported", "جمبسوت", "أفرول"],
    calls: [
      {
        toolName: "explainUnsupported",
        input: {
          text: {
            ar: "الجمبسوت غير مدعوم بعد. أقرب خيار: فستان.",
            en: "Jumpsuits are not supported yet. Closest option: a dress.",
          },
          closest: [{ op: "set", path: "category", value: "dress" } satisfies SpecPatchOp],
        },
      },
    ],
  },
  { keywords: ["pocket", "جيب", "جيوب"], calls: [{ toolName: "addPocket", input: { type: "side-seam" } }] },
  {
    keywords: ["longer", "long sleeve", "أطول", "طويل"],
    calls: [{ toolName: "setFeature", input: { path: "sleeve.length", value: "long" } }],
  },
];

/** What the fake chat model says when no keyword matches. */
export const FAKE_CHAT_FALLBACK: FakeToolCall = {
  toolName: "explainUnsupported",
  input: { text: { ar: "لم أفهم التعديل المطلوب.", en: "I did not understand the change." } },
};

/**
 * The fake chat model's tool calls for a message.
 *
 * @param message - The user's message.
 * @returns The tool calls of the first answer whose keyword appears, or the fallback.
 */
export function fakeChatCalls(message: string): readonly FakeToolCall[] {
  const lower = message.toLowerCase();
  return (
    FAKE_CHAT_ANSWERS.find((answer) => answer.keywords.some((word) => lower.includes(word)))?.calls ?? [
      FAKE_CHAT_FALLBACK,
    ]
  );
}

/**
 * The fake explanation model's text: one sentence that names only the fabrics in the prompt's list, in the prompt's
 * language. It reads the same markers the real prompt writes, so tests exercise the whole call path.
 *
 * @param prompt - The user message of the explanation call.
 * @returns A short paragraph.
 */
export function fakeExplanation(prompt: string): string {
  const english = /Language: en/.test(prompt);
  const section = prompt.split("Recommended fabrics:")[1]?.split("\n\n")[0] ?? "";
  const names = section
    .split("\n")
    .map((line) => /^- [^|]+\| ([^|]+) \| (.+)$/.exec(line.trim()))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => (english ? match[2]! : match[1]!).trim());
  const list = names.join(english ? ", " : "، ");
  return english
    ? `These fabrics suit the design because of the reasons listed above: ${list}.`
    : `هذه الأقمشة تناسب التصميم للأسباب المذكورة أعلاه: ${list}.`;
}
