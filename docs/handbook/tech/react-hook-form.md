---
packages: [react-hook-form, "@hookform/resolvers"]
level: intermediate
adr: ADR-029
---

# React Hook Form

**In one line:** Handles form state and validation in React with very few re-renders; a Zod resolver reuses our schemas. Installed with #25.

## What it is (plain words)

A library that tracks what the user typed, which fields were touched and which failed validation, without re-rendering the whole form on each key press. `@hookform/resolvers` connects it to a Zod schema, so the same schema that describes valid data also produces the error messages.

## Why we chose it

ADR-029 picked React Hook Form + Zod for every form. The auth screens use one shared hook (`useAuthForm`) so each screen only says which schema and which auth call to use. Zod error messages are message keys, translated in the component, so Arabic and English share one schema.

## Alternatives we considered (and why not)

Formik (heavier, more re-renders), plain `useState` (repeats validation code in every form), TanStack Form (younger, fewer examples).

## When we would change it

If forms become mostly server-driven (Server Actions with progressive enhancement), the validation could move fully to the server.
