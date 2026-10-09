---
paths:
  - "apps/web/src/**"
---

# Frontend layers (ADR-029)

Four layers per feature in `apps/web/src/features/<feature>/`. Data flows down, calls flow up. `pnpm depcruise` fails on a violation.

| Layer       | Folder        | Contains                                                      | May import                                              |
| ----------- | ------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| UI          | `components/` | props in, JSX out; local UI state only (open, hover)          | `packages/ui`, `model/` types, i18n                     |
| Application | `hooks/`      | TanStack Query, React Hook Form + Zod, Zustand, orchestration | `shared/api`, `model/`, `packages/schemas`              |
| Domain      | `model/`      | pure TypeScript: view-models, mappers, formatting, rules      | `packages/engine`, `packages/schemas`, `packages/utils` |
| Data        | `shared/api/` | the typed API client, error normalisation                     | `packages/schemas`                                      |

- `app/` routes are thin: compose features through their `index.ts`, no logic.
- Another feature is imported only through its `index.ts`. `shared/` never imports a feature.
- The browser never talks to the database. Supabase in the browser exists only in `shared/auth/` for the session.
- Only `shared/api` calls `fetch` (ESLint `no-restricted-globals`).

```tsx
// WRONG: a component fetches and owns server data
export function ClientList() {
  const [clients, setClients] = useState([]);
  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients);
  }, []);
  return (
    <ul>
      {clients.map((c) => (
        <li key={c.id}>{c.name}</li>
      ))}
    </ul>
  );
}

// RIGHT: hook (application) -> model (domain) -> component (UI)
// hooks/use-clients.ts
export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: () => apiRequest("/clients", { schema: clientListSchema }),
  });
}
// model/to-client-rows.ts  (pure, no React)
export function toClientRows(clients: Client[]): ClientRow[] {
  /* map and format */
}
// components/client-list.tsx  (props in, JSX out)
export function ClientList({ rows }: { rows: ClientRow[] }) {
  /* render */
}
```
