// Generates postman/tafsila.postman_collection.json from the app's OpenAPI document
// (itself generated from the Zod route schemas), then injects auth + shared tests.
// Run: pnpm api:postman   (CI runs it and fails if the committed collection is stale)
import { readFileSync, writeFileSync } from "node:fs";
import Converter from "openapi-to-postmanv2";

const spec = readFileSync("apps/web/openapi.json", "utf8");
Converter.convert(
  { type: "string", data: spec },
  { folderStrategy: "Tags", parametersResolution: "Example" },
  (err, out) => {
    if (err || !out.result) {
      console.error(err || out.reason);
      process.exit(1);
    }
    const col = out.output[0].data;
    col.info.name = "Tafsila API";
    col.variable = [{ key: "baseUrl", value: "{{baseUrl}}" }];
    col.auth = { type: "bearer", bearer: [{ key: "token", value: "{{accessToken}}", type: "string" }] };
    col.event = [
      {
        listen: "prerequest",
        script: {
          type: "text/javascript",
          exec: readFileSync("postman/collection-prerequest.js", "utf8").split("\n"),
        },
      },
      {
        listen: "test",
        script: {
          type: "text/javascript",
          exec: readFileSync("postman/collection-tests.js", "utf8").split("\n"),
        },
      },
    ];
    writeFileSync("postman/tafsila.postman_collection.json", JSON.stringify(col, null, 2) + "\n");
    console.log("postman/tafsila.postman_collection.json updated");
  },
);
