/** Types the message keys: `t("unknown.key")` becomes a compile error. */
import type ar from "../messages/ar.json";

declare module "next-intl" {
  /** Tells next-intl the shape of the messages. */
  interface AppConfig {
    Messages: typeof ar;
  }
}
