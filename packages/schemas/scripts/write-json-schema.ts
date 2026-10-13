/** Writes `json/pattern-result.schema.json` from the Zod schema. Run with `pnpm schemas:json`. */
import { writeFileSync } from "node:fs";
import { patternResultJsonSchemaText } from "../src/pattern-json-schema";

writeFileSync(new URL("../json/pattern-result.schema.json", import.meta.url), patternResultJsonSchemaText());
