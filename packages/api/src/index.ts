/** Public entry of `@tafsila/api`. */
export { createApp } from "./app";
export { createContainer, type Container } from "./container";
export { createLazyFetch, type FetchHandler } from "./lazy-app";
export type { AuthContext, TokenVerifier, UserRole } from "./ports/token-verifier";
