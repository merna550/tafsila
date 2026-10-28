/** Prints the fabric seed SQL: `pnpm --filter @tafsila/fabric-kb exec tsx scripts/gen-sql.ts`. */
import { fabricSeedSql } from "../src";

process.stdout.write(`${fabricSeedSql()}\n`);
