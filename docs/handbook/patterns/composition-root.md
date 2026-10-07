# Composition root

**One-line idea:** exactly one place in the program decides which real implementation fills each interface; everything else just receives what it needs.

## Plain words

Code that needs a clock should not create one. It asks for a `Clock` and gets one handed in. The single file that builds all those objects and hands them out is the **composition root**. This style is called _dependency injection_ (done by hand here, no framework).

## Why Tafsila uses it

- Tests pass fakes instead of real services (a fixed clock, an in-memory repository), so they are fast, offline and exact.
- Swapping a vendor is one line in one file ([ARCHITECTURE section 2](../../ARCHITECTURE.md), [ADR-006](../../DECISIONS.md)).
- Different environments (prod, test, local) get different wiring without changing any business code.

## Where in our code

`packages/api/src/container.ts`:

```ts
export function createContainer(overrides: Partial<Container> = {}): Container {
  return {
    clock: createSystemClock(),
    appInfo: { environment: process.env.APP_ENV ?? "local", version: process.env.APP_VERSION ?? "dev" },
    ...overrides,
  };
}
```

- `createApp(container)` in `packages/api/src/app.ts` takes the container as a parameter, and the Next.js route handler calls `createApp()` once with the defaults.
- `packages/api/src/app.test.ts` calls `createContainer({ clock: fixedClock, ... })` to override ports with fakes.
- Configuration is read through `packages/config/src/env.ts` (`loadServerEnv`): environment variables are declared and validated in one place, and the app refuses to start when one is missing or invalid ([CLAUDE.md rule 6](../../../CLAUDE.md)). `createContainer` still reads `APP_ENV` and `APP_VERSION` directly from `process.env`; moving it onto `loadServerEnv` is expected when the first real adapters arrive.

## Learn more

- [Mark Seemann: Composition Root](https://blog.ploeh.dk/2011/07/28/CompositionRoot/)
- [Martin Fowler: Inversion of Control containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html)
- Related: [hexagonal ports and adapters](hexagonal-ports-adapters.md)
