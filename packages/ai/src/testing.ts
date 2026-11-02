/** Test-only entry of `@tafsila/ai` (issue #340): scripted models and fixture answers, so API tests can script a provider answer. Never imported by app code. */
export { fakeAnalysis } from "./fixtures/answers";
export { scriptedDeps, scriptedModel, type ScriptedAnswer } from "./test-models";
