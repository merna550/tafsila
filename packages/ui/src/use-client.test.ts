import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** React hooks and handler props that only work in a Client Component. */
const CLIENT_ONLY =
  /\b(useRef|useState|useEffect|useCallback|useMemo|useId|useContext|createContext)\(|\bon(Click|Change)=\{/;

describe("client-only ui files", () => {
  it("start with a use client directive when they use hooks or event handlers (Server Components import the barrel)", () => {
    const missing = readdirSync(new URL(".", import.meta.url))
      .filter((name) => name.endsWith(".tsx") && !/\.(test|stories)\.tsx$/.test(name))
      .filter((name) => {
        const text = readFileSync(new URL(name, import.meta.url), "utf8");
        const code = text.replace(/\/\*\*[\s\S]*?\*\//g, "");
        return CLIENT_ONLY.test(code) && !text.startsWith('"use client"');
      });
    expect(missing).toEqual([]);
  });
});
