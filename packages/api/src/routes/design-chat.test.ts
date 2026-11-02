import { createFakeAi } from "@tafsila/ai";
import { seedDress, sizeM } from "@tafsila/test-fixtures";
import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryApp, USER_A, USER_B, type MemoryApp } from "../test-support/memory-app";

let api: MemoryApp;
beforeEach(async () => {
  api = await createMemoryApp();
});

/** Loose shape of the JSON bodies these tests read. */
interface Json {
  id: string;
  code: string;
  messageId: string;
  outcome: string;
  changes: { ar: string; en: string }[];
  unsupported?: { text: { en: string }; closest: unknown[] };
  used: number;
  limit: number;
  reused: boolean;
  version: { id: string; versionNo: number; createdBy: string; spec: { pockets: string[] } };
  items: {
    role: string;
    content: string;
    outcome: string;
    appliedVersionId: string | null;
    createdBy?: string;
  }[];
  details?: { used?: number; limit?: number };
}

/**
 * Reads the JSON body of a response.
 *
 * @param res - The response.
 * @returns The parsed body.
 */
async function json(res: Response): Promise<Json> {
  return (await res.json()) as Json;
}

/**
 * Creates a dress design with one saved version for a user.
 *
 * @param userId - Owner.
 * @returns The design id and its first version id.
 */
async function seed(userId: string): Promise<{ designId: string; versionId: string; setId: string }> {
  const design = await json(await api.call(userId, "POST", "/designs", { category: "dress", title: "t" }));
  const set = await json(
    await api.call(userId, "POST", "/measurements", { label: "M", sizeLabel: "M", measurements: sizeM }),
  );
  const saved = await json(
    await api.call(userId, "POST", `/designs/${design.id}/versions`, {
      spec: seedDress,
      measurementSetId: set.id,
      easeProfile: "regular",
      options: { fabricWidthMm: 1400 },
    }),
  );
  return { designId: design.id, versionId: saved.version.id, setId: set.id };
}

/**
 * Sends a chat message.
 *
 * @param userId - Caller.
 * @param s - Design and version.
 * @param message - The text.
 * @returns The response.
 */
const chat = (userId: string | undefined, s: { designId: string; versionId: string }, message: string) =>
  api.call(userId, "POST", `/designs/${s.designId}/chat`, { message, versionId: s.versionId });

describe("POST /designs/:id/chat", () => {
  it("answers a supported request with a bilingual proposal and logs the usage", async () => {
    const s = await seed(USER_A);
    const res = await chat(USER_A, s, "add side pockets");
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body).toMatchObject({ outcome: "proposal", used: 1, limit: 10 });
    expect(body.changes).toHaveLength(1);
    expect(body.changes[0]?.en).toContain("Pockets");
    expect(body.changes[0]?.ar).toContain("الجيوب");
    expect(api.aiUsage.rows).toHaveLength(1);
    expect(api.aiUsage.rows[0]).toMatchObject({ kind: "chat", userId: USER_A, designId: s.designId });
  });

  it("explains an unsupported request and still counts it", async () => {
    const s = await seed(USER_A);
    const body = await json(await chat(USER_A, s, "make it a jumpsuit"));
    expect(body.outcome).toBe("unsupported");
    expect(body.changes).toEqual([]);
    expect(body.unsupported?.text.en).toContain("Jumpsuits");
    expect(body.used).toBe(1);
  });

  it("stops the 11th message with CHAT_QUOTA_EXCEEDED", async () => {
    api = await createMemoryApp({}, { jobsConfig: { rateLimitPerMinute: 50 } });
    const s = await seed(USER_A);
    for (let i = 0; i < 10; i += 1) expect((await chat(USER_A, s, "jumpsuit")).status).toBe(200);
    const res = await chat(USER_A, s, "jumpsuit");
    expect(res.status).toBe(429);
    const body = await json(res);
    expect(body.code).toBe("CHAT_QUOTA_EXCEEDED");
    expect(body.details).toMatchObject({ used: 10, limit: 10 });
  });

  it("refuses over the daily cap with CHAT_DAILY_LIMIT", async () => {
    api = await createMemoryApp({}, { jobsConfig: { chatDailyLimit: 1, rateLimitPerMinute: 50 } });
    const a = await seed(USER_A);
    expect((await chat(USER_A, a, "jumpsuit")).status).toBe(200);
    const res = await chat(USER_A, a, "jumpsuit");
    expect(res.status).toBe(429);
    expect((await json(res)).code).toBe("CHAT_DAILY_LIMIT");
  });

  it("rate limits above the per-minute cap", async () => {
    api = await createMemoryApp({}, { jobsConfig: { rateLimitPerMinute: 1 } });
    const s = await seed(USER_A);
    expect((await chat(USER_A, s, "jumpsuit")).status).toBe(200);
    expect((await json(await chat(USER_A, s, "jumpsuit"))).code).toBe("RATE_LIMITED");
  });

  it("requires sign-in and hides other users' designs and versions", async () => {
    const a = await seed(USER_A);
    const b = await seed(USER_B);
    expect((await chat(undefined, a, "x")).status).toBe(401);
    expect((await chat(USER_B, a, "x")).status).toBe(404);
    expect((await chat(USER_A, { designId: a.designId, versionId: b.versionId }, "x")).status).toBe(404);
    expect((await api.call(USER_B, "GET", `/designs/${a.designId}/chat`)).status).toBe(404);
  });

  it("validates the body", async () => {
    const s = await seed(USER_A);
    expect((await chat(USER_A, s, "")).status).toBe(400);
    expect((await chat(USER_A, s, "x".repeat(501))).status).toBe(400);
  });

  it("logs a failed provider call and answers AI_CHAT_FAILED without storing messages", async () => {
    const failing = createFakeAi();
    api = await createMemoryApp(
      {},
      { ai: { ...failing, config: { ...failing.config, provider: "anthropic" } } },
    );
    const s = await seed(USER_A);
    const res = await chat(USER_A, s, "add pockets");
    expect(res.status).toBe(502);
    expect((await json(res)).code).toBe("AI_CHAT_FAILED");
    expect(api.aiUsage.rows).toHaveLength(1);
    expect((await json(await api.call(USER_A, "GET", `/designs/${s.designId}/chat`))).items).toHaveLength(0);
  });
});

describe("GET /designs/:id/chat", () => {
  it("lists the history oldest first with the quota", async () => {
    const s = await seed(USER_A);
    await chat(USER_A, s, "add side pockets");
    const body = await json(await api.call(USER_A, "GET", `/designs/${s.designId}/chat`));
    expect(body.items.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(body.items[0]?.content).toBe("add side pockets");
    expect(body).toMatchObject({ used: 1, limit: 10 });
    expect(body.items[1]).not.toHaveProperty("proposedPatch");
  });
});

describe("POST /designs/:id/chat/:msgId/apply", () => {
  it("saves a version created by chat, moves the current version and is idempotent", async () => {
    const s = await seed(USER_A);
    const sent = await json(await chat(USER_A, s, "add side pockets"));
    const url = `/designs/${s.designId}/chat/${sent.messageId}/apply`;
    const first = await api.call(USER_A, "POST", url);
    expect(first.status).toBe(201);
    const applied = await json(first);
    expect(applied.version).toMatchObject({ versionNo: 2, createdBy: "chat" });
    expect(applied.version.spec.pockets).toContain("side-seam");
    const second = await api.call(USER_A, "POST", url);
    expect(second.status).toBe(200);
    expect((await json(second)).version.id).toBe(applied.version.id);
    const design = (await (await api.call(USER_A, "GET", `/designs/${s.designId}`)).json()) as {
      design: { currentVersionId: string };
    };
    expect(design.design.currentVersionId).toBe(applied.version.id);
    const versions = await json(await api.call(USER_A, "GET", `/designs/${s.designId}/versions`));
    expect(versions.items).toHaveLength(2);
    const history = await json(await api.call(USER_A, "GET", `/designs/${s.designId}/chat`));
    expect(history.items[1]?.appliedVersionId).toBe(applied.version.id);
  });

  it("refuses a proposal made on a version that is no longer current (409)", async () => {
    const s = await seed(USER_A);
    const sent = await json(await chat(USER_A, s, "add side pockets"));
    await api.call(USER_A, "POST", `/designs/${s.designId}/versions`, {
      spec: { ...seedDress, lining: !seedDress.lining },
      measurementSetId: s.setId,
      easeProfile: "regular",
      options: { fabricWidthMm: 1400 },
    });
    const res = await api.call(USER_A, "POST", `/designs/${s.designId}/chat/${sent.messageId}/apply`);
    expect(res.status).toBe(409);
    expect((await json(res)).code).toBe("CHAT_PROPOSAL_STALE");
  });

  it("has nothing to apply on an unsupported answer or a user message", async () => {
    const s = await seed(USER_A);
    const sent = await json(await chat(USER_A, s, "jumpsuit"));
    const res = await api.call(USER_A, "POST", `/designs/${s.designId}/chat/${sent.messageId}/apply`);
    expect(res.status).toBe(422);
    expect((await json(res)).code).toBe("CHAT_NOTHING_TO_APPLY");
  });

  it("hides another user's message and needs sign-in", async () => {
    const s = await seed(USER_A);
    const sent = await json(await chat(USER_A, s, "add side pockets"));
    const url = `/designs/${s.designId}/chat/${sent.messageId}/apply`;
    expect((await api.call(undefined, "POST", url)).status).toBe(401);
    expect((await api.call(USER_B, "POST", url)).status).toBe(404);
    expect(
      (await api.call(USER_A, "POST", `/designs/${s.designId}/chat/${crypto.randomUUID()}/apply`)).status,
    ).toBe(404);
  });
});
