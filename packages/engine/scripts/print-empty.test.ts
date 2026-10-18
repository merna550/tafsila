/** `engine:print` refuses to write a sheet for a pattern without pieces (a design whose modules are not built). */
import { describe, expect, it, vi } from "vitest";
import type * as Pipeline from "../src/pipeline";
import { run } from "./print";

vi.mock("../src/pipeline", async (importOriginal) => ({
  ...(await importOriginal<typeof Pipeline>()),
  generatePattern: () => ({ pieces: [] }),
}));

describe("engine:print without pieces", () => {
  it("exits 1 and says there is nothing to print", () => {
    const err: string[] = [];
    const code = run(["dartedBlouse", "size-m"], { out: () => undefined, err: (l) => err.push(l) });
    expect(code).toBe(1);
    expect(err.join("\n")).toContain("no pieces");
  });
});
