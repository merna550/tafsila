/** Code generators (`pnpm gen`): endpoint, feature and garment-module boilerplate from templates (issue #33). */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PlopTypes } from "@turbo/gen";

/** Prompt answers plus the turbo paths. */
type Data = Record<string, unknown>;
/** Actions of one generator. */
type Actions = NonNullable<PlopTypes.PlopGeneratorConfig["actions"]>;

/** Where templates live, relative to this file. */
const TEMPLATES = "templates";
/** Kebab-case name: lowercase words joined by single dashes, starting with a letter. */
const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
/** Length of `YYYY-MM-DD`. */
const ISO_DATE_LENGTH = 10;
/** Digits only. */
const DIGITS = /^\d+$/;

/** The two questions every generator asks. */
const PROMPTS: PlopTypes.PlopGeneratorConfig["prompts"] = [
  {
    type: "input",
    name: "name",
    message: "Name in kebab-case, singular (for example garment-note)",
    validate: (value: string) => KEBAB.test(value) || "Use lowercase words joined by dashes",
  },
  {
    type: "input",
    name: "issue",
    message: "Issue number the work belongs to (used in NEXT comments and test-case files)",
    validate: (value: string) => DIGITS.test(value) || "Digits only",
  },
];

/**
 * Builds an `add` action that creates one file from a template.
 *
 * @param path - Destination under the repo root (Handlebars allowed).
 * @param template - Template file under `templates/`.
 * @param skipIfExists - Keep an existing file instead of failing.
 * @returns The plop action.
 */
function addFile(path: string, template: string, skipIfExists = false): PlopTypes.ActionType {
  return {
    type: "add",
    path: `{{ turbo.paths.root }}/${path}`,
    templateFile: `${TEMPLATES}/${template}`,
    skipIfExists,
  };
}

/**
 * Turns a kebab-case name into camelCase.
 *
 * @param name - Kebab-case name.
 * @returns The camelCase name.
 */
function camelCase(name: string): string {
  return name.replace(/-([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase());
}

/**
 * Adds a top-level section with a `title` to a messages file.
 *
 * @param root - Repo root.
 * @param locale - "ar" or "en".
 * @param key - Section key (camelCase name).
 * @param title - Placeholder title.
 * @returns A confirmation line.
 */
function addMessages(root: string, locale: string, key: string, title: string): string {
  const file = join(root, "apps/web/messages", `${locale}.json`);
  const messages = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
  if (key in messages) return `${locale}.json already has "${key}"`;
  messages[key] = { title };
  writeFileSync(file, `${JSON.stringify(messages, null, 2)}\n`);
  return `${locale}.json: added "${key}.title"`;
}

/**
 * Custom action: adds the feature's message keys to both languages.
 *
 * @param answers - Prompt answers plus `turbo.paths.root`.
 * @returns A confirmation line.
 */
function addFeatureMessages(answers: Data): string {
  const { turbo, name } = answers as { turbo: { paths: { root: string } }; name: string };
  const key = camelCase(name);
  const title = name.replace(/-/g, " ");
  return ["ar", "en"].map((locale) => addMessages(turbo.paths.root, locale, key, title)).join("; ");
}

/**
 * Builds a custom action that formats what the generator wrote, so it passes `pnpm format:check` untouched.
 *
 * @param globs - Files to format, relative to the repo root (`{kebab}` and `{issue}` are filled in).
 * @returns The plop action.
 */
function format(globs: readonly string[]): PlopTypes.ActionType {
  return (answers: Data) => {
    const { turbo, name, issue } = answers as {
      turbo: { paths: { root: string } };
      name: string;
      issue: string;
    };
    const targets = globs.map((glob) => glob.replaceAll("{kebab}", name).replaceAll("{issue}", issue));
    execFileSync(
      join(turbo.paths.root, "node_modules/.bin/prettier"),
      ["--write", "--log-level", "warn", ...targets],
      {
        cwd: turbo.paths.root,
      },
    );
    return "formatted with prettier";
  };
}

/**
 * Builds a custom action that only prints the manual steps left for the agent.
 *
 * @param lines - One step per line; `{camel}` becomes the camelCase name.
 * @returns The plop action.
 */
function note(lines: readonly string[]): PlopTypes.ActionType {
  return (answers: Data) => {
    const camel = camelCase(String(answers.name));
    const steps = lines.map((line) => "  - " + line.replaceAll("{camel}", camel));
    return ["Next steps:", ...steps].join("\n");
  };
}

/**
 * Actions of the endpoint generator.
 *
 * @returns The plop actions.
 */
function endpointActions(): Actions {
  const api = "packages/api/src";
  const kebab = "{{kebabCase name}}";
  return [
    addFile(`packages/schemas/src/${kebab}.ts`, "endpoint/schema.ts.hbs"),
    {
      type: "append",
      path: "{{ turbo.paths.root }}/packages/schemas/src/index.ts",
      pattern: /export \* from "\.\/pagination";/,
      template: `export * from "./${kebab}";`,
    },
    addFile(`${api}/ports/${kebab}-repository.ts`, "endpoint/port.ts.hbs"),
    addFile(`${api}/adapters/memory/${kebab}-repository.ts`, "endpoint/memory-adapter.ts.hbs"),
    addFile(`${api}/services/create-${kebab}.ts`, "endpoint/create-service.ts.hbs"),
    addFile(`${api}/services/get-${kebab}.ts`, "endpoint/get-service.ts.hbs"),
    addFile(`${api}/services/${kebab}.test.ts`, "endpoint/service.test.ts.hbs"),
    addFile(`${api}/routes/${kebab}s.ts`, "endpoint/route.ts.hbs"),
    addFile(`${api}/routes/${kebab}s.test.ts`, "endpoint/route.test.ts.hbs"),
    addFile(`docs/test-cases/api/{{issue}}-${kebab}.md`, "endpoint/test-case.md.hbs"),
    format([
      "packages/schemas/src/{kebab}.ts",
      "packages/api/src/**/*{kebab}*.ts",
      "docs/test-cases/api/{issue}-{kebab}.md",
    ]),
    note([
      "Wire it: add `{camel}s` to the Container (container.ts), mount `{camel}Routes` in app.ts, add the memory repository to test-support/memory-app.ts.",
      "Add the Supabase adapter and migration if the data is stored (see docs/backend/tutorials/add-endpoint.md).",
      "Run pnpm api:openapi && pnpm api:postman, then add an `ERR ...` case to postman/err-cases.json (Postman entry).",
      "Update SRS section 8, then run scripts/test-case-index.sh.",
    ]),
  ];
}

/**
 * Actions of the feature generator.
 *
 * @returns The plop actions.
 */
function featureActions(): Actions {
  const dir = "apps/web/src/features/{{kebabCase name}}";
  return [
    addFile(`${dir}/index.ts`, "feature/index.ts.hbs"),
    addFile(`${dir}/components/{{pascalCase name}}Heading.tsx`, "feature/heading.tsx.hbs"),
    addFile(`${dir}/components/{{pascalCase name}}Heading.test.tsx`, "feature/components.test.tsx.hbs"),
    addFile(`${dir}/hooks/query-keys.ts`, "feature/query-keys.ts.hbs"),
    addFile(`${dir}/hooks/use-{{kebabCase name}}.ts`, "feature/hook.ts.hbs"),
    addFile(`${dir}/model/{{kebabCase name}}-view.ts`, "feature/view.ts.hbs"),
    addFile(`${dir}/model/{{kebabCase name}}-view.test.ts`, "feature/view.test.ts.hbs"),
    addFile("docs/test-cases/ui/{{issue}}-{{kebabCase name}}.md", "feature/test-case.md.hbs"),
    addFeatureMessages,
    format([
      "apps/web/src/features/{kebab}",
      "apps/web/messages/*.json",
      "docs/test-cases/ui/{issue}-{kebab}.md",
    ]),
    note([
      "Add the thin route under apps/web/src/app/[locale]/ that composes the feature through its index.ts.",
      "Replace the placeholder title in messages/ar.json and messages/en.json with real copy (docs/design/copy.md).",
      "Then follow the add-page skill from step 4 (UI, states, e2e), and run scripts/test-case-index.sh.",
    ]),
  ];
}

/**
 * Actions of the garment-module generator.
 *
 * @returns The plop actions.
 */
function garmentModuleActions(): Actions {
  const dir = "packages/engine/src/modules";
  return [
    addFile(`${dir}/feature-module.ts`, "garment-module/feature-module.ts.hbs", true),
    addFile(`${dir}/{{kebabCase name}}.ts`, "garment-module/module.ts.hbs"),
    addFile(`${dir}/{{kebabCase name}}-validation.ts`, "garment-module/validation.ts.hbs"),
    addFile(`${dir}/{{kebabCase name}}.test.ts`, "garment-module/test.ts.hbs"),
    addFile("docs/test-cases/engine/{{issue}}-{{kebabCase name}}.md", "garment-module/test-case.md.hbs"),
    format(["packages/engine/src/modules/*.ts", "docs/test-cases/engine/{issue}-{kebab}.md"]),
    note([
      "Write the drafting method and its source in the module JSDoc (geometry needs a plan:opus plan).",
      "Extend the DesignSpec enum in packages/schemas, register the module, export it from packages/engine/src/index.ts.",
      "Replace the placeholder outline and rule, add one fast-check property per FR-VAL rule and an SVG snapshot per size.",
      "Add the needs:sew-test label, update docs/engine/README.md, then run scripts/test-case-index.sh.",
    ]),
  ];
}

/**
 * Registers the three generators.
 *
 * @param plop - The plop API given by `turbo gen`.
 */
export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setHelper("today", () => new Date().toISOString().slice(0, ISO_DATE_LENGTH));
  plop.setGenerator("endpoint", {
    description: "API endpoint: schema, port, memory adapter, services, route, tests, test-case file",
    prompts: PROMPTS,
    actions: endpointActions(),
  });
  plop.setGenerator("feature", {
    description: "Web feature folder: components, hooks, model, messages, tests, test-case file",
    prompts: PROMPTS,
    actions: featureActions(),
  });
  plop.setGenerator("garment-module", {
    description: "Engine garment module: FeatureModule skeleton, validation stub, property test",
    prompts: PROMPTS,
    actions: garmentModuleActions(),
  });
}
