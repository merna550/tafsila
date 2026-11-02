import { describe, expect, it, vi } from "vitest";
import { uploadToSignedUrl } from "./upload-file";

/** Progress event shape the helper reads. */
type ProgressLike = { lengthComputable: boolean; loaded: number; total: number };

/** A fake request the test drives by hand. */
interface Fake {
  readonly request: XMLHttpRequest;
  readonly abort: ReturnType<typeof vi.fn>;
  readonly open: ReturnType<typeof vi.fn>;
  readonly progress: (loaded: number, total: number) => void;
  readonly load: (status: number) => void;
  readonly error: () => void;
  readonly timeout: () => void;
}

/**
 * Builds a fake XMLHttpRequest whose events the test fires.
 *
 * @returns The fake and its triggers.
 */
function fake(): Fake {
  const upload: { onprogress: ((event: ProgressLike) => void) | null } = { onprogress: null };
  const abort = vi.fn();
  const open = vi.fn();
  const state: Record<string, unknown> = {
    status: 0,
    timeout: 0,
    upload,
    open,
    setRequestHeader: vi.fn(),
    send: vi.fn(),
    abort,
  };
  const fire = (name: string): void => {
    const handler = state[name] as ((event: unknown) => void) | undefined;
    handler?.({});
  };
  abort.mockImplementation(() => fire("onabort"));
  return {
    request: state as unknown as XMLHttpRequest,
    abort,
    open,
    progress: (loaded, total) => upload.onprogress?.({ lengthComputable: true, loaded, total }),
    load: (status) => {
      state.status = status;
      fire("onload");
    },
    error: () => fire("onerror"),
    timeout: () => fire("ontimeout"),
  };
}

describe("uploadToSignedUrl", () => {
  it("PUTs the blob, reports progress and resolves on 2xx", async () => {
    const f = fake();
    const progress: number[] = [];
    const done = uploadToSignedUrl("https://s/x", new Blob(["a"], { type: "image/jpeg" }), {
      createRequest: () => f.request,
      onProgress: (value) => progress.push(value),
    });
    f.progress(1, 4);
    f.load(200);
    await done;
    expect(f.open).toHaveBeenCalledWith("PUT", "https://s/x");
    expect(progress).toEqual([0.25, 1]);
  });

  it("rejects with a network or timeout error", async () => {
    const first = fake();
    const failure = uploadToSignedUrl("u", new Blob(["a"]), { createRequest: () => first.request });
    first.error();
    await expect(failure).rejects.toMatchObject({ kind: "network" });
    const second = fake();
    const late = uploadToSignedUrl("u", new Blob(["a"]), { createRequest: () => second.request });
    second.timeout();
    await expect(late).rejects.toMatchObject({ kind: "timeout" });
  });

  it("rejects when storage refuses the file", async () => {
    const f = fake();
    const refused = uploadToSignedUrl("u", new Blob(["a"]), { createRequest: () => f.request });
    f.load(403);
    await expect(refused).rejects.toMatchObject({ kind: "unknown" });
  });

  it("aborts on the cancel signal", async () => {
    const f = fake();
    const controller = new AbortController();
    const cancelled = uploadToSignedUrl("u", new Blob(["a"]), {
      createRequest: () => f.request,
      signal: controller.signal,
    });
    controller.abort();
    await expect(cancelled).rejects.toBeDefined();
    expect(f.abort).toHaveBeenCalled();
  });
});
