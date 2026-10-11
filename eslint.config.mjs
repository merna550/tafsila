// Tafsila ESLint config (flat). Enforces docs/CODING_STANDARDS.md.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import jsdoc from "eslint-plugin-jsdoc";
import sonarjs from "eslint-plugin-sonarjs";
import importPlugin from "eslint-plugin-import-x";
import prettier from "eslint-config-prettier";
import globals from "globals";
import { FETCH_MESSAGE, textRules, tokenRules } from "./eslint-rules/frontend.mjs";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/storybook-static/**",
      "**/test-results/**",
      "**/.next/**",
      "**/coverage/**",
      "**/*.gen.ts",
      "postman/**",
      "supabase/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  sonarjs.configs.recommended,
  jsdoc.configs["flat/recommended-typescript-error"],
  {
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    plugins: { "import-x": importPlugin },
    rules: {
      // --- Every function / component / type documents its purpose ---
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: false,
          require: {
            FunctionDeclaration: true,
            FunctionExpression: false,
            ArrowFunctionExpression: false,
            MethodDefinition: true,
            ClassDeclaration: true,
          },
          // Named arrow functions (const x = () => …) and types need docs; inline callbacks do not.
          contexts: [
            "VariableDeclaration > VariableDeclarator > ArrowFunctionExpression",
            "TSInterfaceDeclaration",
            "TSTypeAliasDeclaration",
            "TSEnumDeclaration",
          ],
          checkConstructors: false,
        },
      ],
      "jsdoc/require-description": ["error", { contexts: ["any"] }],
      "jsdoc/require-param-description": "error",
      "jsdoc/require-returns-description": "error",
      "jsdoc/tag-lines": ["error", "any", { startLines: 1 }],
      "jsdoc/require-param": ["error", { checkDestructured: false }],
      "jsdoc/check-param-names": ["error", { checkDestructured: false }],

      // --- Readability / size ---
      complexity: ["error", 10],
      "max-depth": ["error", 3],
      "max-params": ["error", 4],
      "max-lines-per-function": ["error", { max: 60, skipBlankLines: true, skipComments: true }],
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      "no-nested-ternary": "error",
      "sonarjs/cognitive-complexity": ["error", 15],
      "no-magic-numbers": [
        "warn",
        {
          ignore: [-1, 0, 1, 2, 100],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          enforceConst: true,
        },
      ],

      // --- Safety ---
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],

      // --- Structure ---
      "import-x/no-cycle": "error",
      "import-x/no-duplicates": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../../*"],
              message: "Import shared code from its package (e.g. @tafsila/engine), not deep relative paths.",
            },
          ],
        },
      ],
    },
  },
  {
    // Frontend (ADR-029): tokens only, logical direction only, strings from messages, fetch only in shared/api.
    files: ["apps/web/src/**/*.{ts,tsx}", "packages/ui/src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}", "**/*.stories.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", ...tokenRules, ...textRules],
      "no-restricted-globals": ["error", { name: "fetch", message: FETCH_MESSAGE }],
      "no-restricted-properties": [
        "error",
        { object: "window", property: "fetch", message: FETCH_MESSAGE },
        { object: "globalThis", property: "fetch", message: FETCH_MESSAGE },
      ],
    },
  },
  {
    // The API client is the one place allowed to call fetch.
    files: ["apps/web/src/shared/api/**/*.ts"],
    rules: { "no-restricted-globals": "off", "no-restricted-properties": "off" },
  },
  {
    // M0 placeholder screens keep Arabic text inline until M1 wave 3 adds next-intl and messages/{ar,en}.json (#66).
    files: ["apps/web/src/app/page.tsx", "apps/web/src/app/layout.tsx", "apps/web/src/features/home/**"],
    rules: { "no-restricted-syntax": ["error", ...tokenRules] },
  },
  {
    // Config and script files (JS or outside a tsconfig): lint without type information.
    files: ["**/*.mjs", "**/*.cjs", "**/*.config.ts", "**/*.config.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { parserOptions: { projectService: false }, globals: { ...globals.node } },
    rules: { "jsdoc/require-jsdoc": "off", "no-magic-numbers": "off", "no-console": "off" },
  },
  {
    // Plain-JS scripts keep their types in JSDoc (no TypeScript annotations), so the TS-flavoured JSDoc rules are relaxed.
    files: ["scripts/**/*.mjs", "eslint-rules/**/*.mjs"],
    rules: {
      "jsdoc/no-types": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "max-lines-per-function": ["error", { max: 60, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // Storybook config imports ESM-only Vite plugins that the cycle resolver cannot load.
    files: ["packages/ui/.storybook/**"],
    rules: { "import-x/no-cycle": "off" },
  },
  {
    // Stories are examples: the story name is its documentation.
    files: ["**/*.stories.tsx"],
    rules: { "jsdoc/require-jsdoc": "off", "max-lines-per-function": "off" },
  },
  {
    // Tests: allow longer blocks and anonymous callbacks without JSDoc.
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.test.mjs", "**/*.spec.ts", "e2e/**"],
    rules: {
      "jsdoc/require-jsdoc": "off",
      "max-lines-per-function": "off",
      "no-magic-numbers": "off",
      "sonarjs/no-duplicate-string": "off",
    },
  },
  prettier,
);
