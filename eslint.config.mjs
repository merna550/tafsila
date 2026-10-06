// Tafsila ESLint config (flat). Enforces docs/CODING_STANDARDS.md.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import jsdoc from "eslint-plugin-jsdoc";
import sonarjs from "eslint-plugin-sonarjs";
import importPlugin from "eslint-plugin-import-x";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/.next/**", "**/coverage/**", "**/*.gen.ts", "postman/**", "supabase/**"] },
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
    // Config and script files (JS or outside a tsconfig): lint without type information.
    files: ["**/*.mjs", "**/*.cjs", "**/*.config.ts", "**/*.config.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { parserOptions: { projectService: false }, globals: { ...globals.node } },
    rules: { "jsdoc/require-jsdoc": "off", "no-magic-numbers": "off", "no-console": "off" },
  },
  {
    // Tests: allow longer blocks and anonymous callbacks without JSDoc.
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "e2e/**"],
    rules: {
      "jsdoc/require-jsdoc": "off",
      "max-lines-per-function": "off",
      "no-magic-numbers": "off",
      "sonarjs/no-duplicate-string": "off",
    },
  },
  prettier,
);
