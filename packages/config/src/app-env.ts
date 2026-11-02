/** The deployment environments, in a file of their own so `env.ts` and `jobs.ts` can both read them without importing each other. */
/** Deployment environments the app can run in. */
export const APP_ENVIRONMENTS = ["local", "ci", "preview", "staging", "production"] as const;
