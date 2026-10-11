// Fails when a stylesheet outside packages/ui/src/tokens.css holds a raw colour (ADR-031).
// ESLint covers TS/TSX; this covers CSS. Usage: node scripts/check-design-tokens.mjs
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SCAN_DIRS = ["apps/web/src", "packages/ui/src"];
const ALLOWED = "packages/ui/src/tokens.css";
const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\(/;

/**
 * Lists CSS files under a folder.
 *
 * @param {string} dir - Folder to scan.
 * @returns {string[]} Absolute paths of .css files.
 */
function cssFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "node_modules" ? [] : cssFiles(path);
    return path.endsWith(".css") ? [path] : [];
  });
}

/**
 * Finds raw colours in CSS files other than the tokens file.
 *
 * @param {string} root - Repository root.
 * @returns {string[]} One "file:line text" entry per violation.
 */
export function findRawColors(root = ROOT) {
  const found = [];
  for (const dir of SCAN_DIRS) {
    for (const file of cssFiles(join(root, dir))) {
      const name = relative(root, file);
      if (name === ALLOWED) continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, index) => {
          if (RAW_COLOR.test(line)) found.push(`${name}:${index + 1} ${line.trim()}`);
        });
    }
  }
  return found;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const found = findRawColors();
  if (found.length > 0) {
    console.error(`Raw colours outside ${ALLOWED}:\n${found.join("\n")}`);
    process.exit(1);
  }
  console.log("design tokens OK (no raw colours outside tokens.css)");
}
