/** Prints the default size chart insert (run: `pnpm --filter @tafsila/api exec tsx ../test-fixtures/src/gen-size-chart-sql.ts`). */
import { defaultSizeChartInsertSql } from "./size-chart-sql";

process.stdout.write(`${defaultSizeChartInsertSql()}\n`);
