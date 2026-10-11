// Frontend lint rules (ADR-029): design tokens only, logical direction only, no hard-coded UI strings, fetch only in shared/api.
// Each entry is an ESLint `no-restricted-syntax` selector; esquery regexes cannot contain "/".

const RAW_COLOR =
  "(^|[^\\w&])#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})($|[^\\w])|\\b(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\\(";
const ARBITRARY_VALUE = "(^|[\\s:!])-?[a-z][a-z0-9-]*-\\[[^\\]]+\\]";
const PHYSICAL_DIRECTION =
  "(^|[\\s:!])-?((m|p|scroll-m|scroll-p)[lr]|left|right)-|(^|[\\s:!])(text-(left|right)|float-(left|right)|clear-(left|right)|(border|rounded)-(l|r|tl|tr|bl|br)(-|$|\\s))";
const TEXT_ATTRIBUTES = "^(aria-label|aria-description|placeholder|title|alt|label)$";
const LETTERS = "[A-Za-z\\u0600-\\u06FF]";

/**
 * Builds a selector that flags string literals and template parts matching a regex.
 *
 * @param {string} pattern - Regex source (no "/").
 * @returns {string[]} Selectors for string literals and template chunks.
 */
function stringsMatching(pattern) {
  return [`Literal[value=/${pattern}/]`, `TemplateElement[value.raw=/${pattern}/]`];
}

/**
 * Wraps selectors into restricted-syntax entries with one message.
 *
 * @param {string[]} selectors - Selectors.
 * @param {string} message - Why it is forbidden and what to do instead.
 * @returns {{selector: string, message: string}[]} Entries.
 */
function entries(selectors, message) {
  return selectors.map((selector) => ({ selector, message }));
}

/** Design token rules: raw colours and arbitrary Tailwind values are only allowed in packages/ui/src/tokens.css. */
export const tokenRules = [
  ...entries(
    stringsMatching(RAW_COLOR),
    "Raw colour. Use a design token class (bg-primary, text-muted) defined in packages/ui/src/tokens.css.",
  ),
  ...entries(
    stringsMatching(ARBITRARY_VALUE),
    "Arbitrary Tailwind value. Use a token or a scale class; add a token in packages/ui/src/tokens.css if one is missing.",
  ),
  ...entries(
    stringsMatching(PHYSICAL_DIRECTION),
    "Physical direction breaks RTL. Use logical classes: ms-*, me-*, ps-*, pe-*, start-*, end-*, text-start, text-end.",
  ),
];

/** Text rules: every user-facing string comes from messages/{ar,en}.json. */
export const textRules = [
  ...entries(
    [
      `JSXText[value=/${LETTERS}/]`,
      `JSXAttribute[name.name=/${TEXT_ATTRIBUTES}/] > Literal[value=/${LETTERS}/]`,
    ],
    "Hard-coded user-facing text. Add a key to messages/ar.json and messages/en.json and read it with the translation hook.",
  ),
];

/** Message for the fetch restriction. */
export const FETCH_MESSAGE =
  "Only apps/web/src/shared/api may call fetch. Use apiRequest from shared/api so errors become ApiError.";
