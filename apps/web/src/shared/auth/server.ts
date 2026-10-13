/** Server-only entry of auth (Server Components, layouts and the proxy). Client components import `index.ts` instead. */
export { getSessionRole, getSessionUser } from "./session";
export { updateSession } from "./update-session";
