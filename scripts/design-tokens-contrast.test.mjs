// Tests that every colour pair the design system allows is readable: WCAG contrast (issue #80).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DERIVED, resolve } from "./gen-tokens.mjs";

const json = JSON.parse(
  readFileSync(join(new URL("..", import.meta.url).pathname, "docs/design-system/tokens.json"), "utf8"),
);
const NEUTRALS = ["surface", "surface-raised", "surface-sunken"];

/**
 * Looks up a colour by token name (or a derived one) as r, g, b.
 *
 * @param {string} name - Token name.
 * @returns {number[]} RGB channels 0-255.
 */
function rgb(name) {
  const hex = (DERIVED[name] ?? resolve(json.color.tokens, name)).replace("#", "");
  return [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
}

/**
 * Computes the WCAG relative luminance of a token.
 *
 * @param {string} name - Token name.
 * @returns {number} Luminance 0-1.
 */
function luminance(name) {
  const [r, g, b] = rgb(name).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Computes the WCAG contrast ratio between two tokens.
 *
 * @param {string} a - First token name.
 * @param {string} b - Second token name.
 * @returns {number} Ratio from 1 to 21.
 */
function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Pairs [foreground, background] that carry text and must reach 4.5:1. */
const TEXT_PAIRS = [
  ...["ink", "ink-muted", "primary", "success", "warning", "danger", "accent"].flatMap((fg) =>
    NEUTRALS.map((bg) => [fg, bg]),
  ),
  ["on-primary", "primary"],
  ["on-primary", "danger"],
  ["on-primary", "success"],
  ["on-primary", "warning"],
  ["on-primary", "primary-hover"],
  ["on-accent", "accent"],
  ["ink", "saffron"],
  ["ink", "primary-soft"],
  ["ink", "accent-soft"],
  ["primary", "primary-soft"],
];

/** Pairs that are controls or focus indicators and must reach 3:1. */
const NON_TEXT_PAIRS = [
  ["border-strong", "surface-raised"],
  ["border-strong", "surface"],
  ["focus-ring", "surface"],
  ["focus-ring", "surface-raised"],
];

describe("design token contrast", () => {
  it.each(TEXT_PAIRS)("text %s on %s is at least 4.5:1", (fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(NON_TEXT_PAIRS)("%s on %s is at least 3:1", (fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(3);
  });
});
