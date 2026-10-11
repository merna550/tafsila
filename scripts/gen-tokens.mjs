// Generates the brand part of packages/ui/src/tokens.css from docs/design-system/tokens.json (issue #80).
// Usage: node scripts/gen-tokens.mjs          (rewrite tokens.css)
//        node scripts/gen-tokens.mjs --check  (fail when tokens.css is out of date)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const TOKENS_JSON = "docs/design-system/tokens.json";
const TOKENS_CSS = "packages/ui/src/tokens.css";
export const BEGIN = "/* BEGIN GENERATED */";
export const END = "/* END GENERATED */";

/** Hover shade of primary: not in tokens.json, so it lives here and the contrast test covers it. */
export const DERIVED = { "primary-hover": "#0A5651" };

/** CSS colour role -> approved token name (the issue's mapping table). */
export const COLOR_ROLES = {
  background: "surface",
  surface: "surface-raised",
  "surface-hover": "surface-sunken",
  line: "line",
  border: "border-strong",
  text: "ink",
  muted: "ink-muted",
  primary: "primary",
  "on-primary": "on-primary",
  "primary-soft": "primary-soft",
  accent: "accent",
  "on-accent": "on-accent",
  "accent-soft": "accent-soft",
  saffron: "saffron",
  success: "success",
  warning: "warning",
  danger: "danger",
  focus: "focus-ring",
  info: "primary",
};

/** Brand type style -> Tailwind text size name. */
export const TEXT_SIZES = {
  caption: "xs",
  "body-sm": "sm",
  body: "base",
  heading: "lg",
  title: "xl",
  display: "2xl",
};

/** Brand radius token -> Tailwind radius name. */
const RADII = { "radius-sm": "sm", "radius-md": "md", "radius-lg": "lg" };

/**
 * Converts a pixel string to rem.
 *
 * @param {string} px - Value like "17px".
 * @returns {string} Value like "1.0625rem".
 */
export function toRem(px) {
  return `${Number.parseFloat(px) / 16}rem`;
}

/**
 * Finds a token by name in a flat list, following "{other}" references.
 *
 * @param {{name: string, value: string}[]} list - Tokens of one group.
 * @param {string} name - Token name.
 * @returns {string} The resolved value.
 */
export function resolve(list, name) {
  const token = list.find((entry) => entry.name === name);
  if (!token) throw new Error(`tokens.json has no token "${name}"`);
  const ref = /^\{(.+)\}$/.exec(token.value);
  return ref ? resolve(list, ref[1]) : token.value;
}

/**
 * Builds the colour lines of the generated block.
 *
 * @param {object} json - Parsed tokens.json.
 * @returns {string[]} CSS declarations.
 */
function colorLines(json) {
  const list = json.color.tokens;
  const lines = ["--color-*: initial;"];
  for (const [role, token] of Object.entries(COLOR_ROLES)) {
    lines.push(`--color-${role}: ${resolve(list, token).toLowerCase()};`);
    if (role === "primary") lines.push(`--color-primary-hover: ${DERIVED["primary-hover"].toLowerCase()};`);
  }
  return lines;
}

/**
 * Builds the font, type scale, radius and shadow lines of the generated block.
 *
 * @param {object} json - Parsed tokens.json.
 * @returns {string[]} CSS declarations.
 */
function shapeLines(json) {
  const family = json.type.families.sans;
  const fallback = family.replace(/^"IBM Plex Sans Arabic",\s*/, "");
  // --font-plex is set by next/font in the web app; Storybook falls back to the plain family name.
  const stack = `var(--font-plex, "IBM Plex Sans Arabic"), ${fallback}`;
  const lines = [`--font-sans: ${stack};`, `--font-latin: ${stack};`, "--text-*: initial;"];
  const styles = json.type.groups.flatMap((group) => group.styles);
  for (const [style, size] of Object.entries(TEXT_SIZES)) {
    const found = styles.find((entry) => entry.name === style);
    if (!found) throw new Error(`tokens.json has no type style "${style}"`);
    lines.push(
      `--text-${size}: ${toRem(found.fontSize)};`,
      `--text-${size}--line-height: ${toRem(found.lineHeight)};`,
    );
  }
  lines.push("--radius-*: initial;");
  for (const [token, name] of Object.entries(RADII))
    lines.push(`--radius-${name}: ${resolve(json.radius.tokens, token)};`);
  lines.push("--shadow-*: initial;");
  for (const entry of json.shadow.tokens) lines.push(`--${entry.name}: ${entry.value};`);
  return lines;
}

/**
 * Builds the generated block (markers included) from tokens.json.
 *
 * @param {object} json - Parsed tokens.json.
 * @returns {string} The block, indented for the theme body.
 */
export function buildBlock(json) {
  const body = [...colorLines(json), ...shapeLines(json)].map((line) => `  ${line}`);
  return [`  ${BEGIN}`, ...body, `  ${END}`].join("\n");
}

/**
 * Replaces the generated block inside a tokens.css text.
 *
 * @param {string} css - Current tokens.css.
 * @param {object} json - Parsed tokens.json.
 * @returns {string} Updated css.
 */
export function applyBlock(css, json) {
  const start = css.indexOf(BEGIN);
  const end = css.indexOf(END);
  if (start < 0 || end < start) throw new Error("tokens.css is missing the BEGIN/END GENERATED markers");
  const lineStart = css.lastIndexOf("\n", start) + 1;
  return css.slice(0, lineStart) + buildBlock(json) + css.slice(end + END.length);
}

/**
 * Reads tokens.json and tokens.css under a root and returns both texts.
 *
 * @param {string} root - Repository root.
 * @returns {{json: object, css: string}} Parsed brand source and current css.
 */
export function readSources(root = ROOT) {
  return {
    json: JSON.parse(readFileSync(join(root, TOKENS_JSON), "utf8")),
    css: readFileSync(join(root, TOKENS_CSS), "utf8"),
  };
}

/**
 * Regenerates tokens.css, or only reports drift in check mode.
 *
 * @param {string} root - Repository root.
 * @param {boolean} check - When true, do not write.
 * @returns {boolean} True when tokens.css is (now) up to date.
 */
export function run(root = ROOT, check = false) {
  const { json, css } = readSources(root);
  const next = applyBlock(css, json);
  if (next === css) return true;
  if (!check) writeFileSync(join(root, TOKENS_CSS), next);
  return !check;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const check = process.argv.includes("--check");
  if (run(ROOT, check)) {
    console.log(check ? "tokens.css is up to date" : "tokens.css generated");
  } else {
    console.error("tokens.css is out of date: run `pnpm tokens` and commit the result");
    process.exit(1);
  }
}
