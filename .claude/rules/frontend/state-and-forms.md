---
paths:
  - "apps/web/src/**"
---

# State and forms

- **Server data**: TanStack Query. Never: copy into `useState`/Zustand
- **Form fields and validation**: React Hook Form + Zod. Never: one `useState` per field
- **Local UI (open, hover, tab)**: `useState`. Never: a global store
- **Cross-component editor state**: Zustand (pattern editor only). Never: server data in the store
- **Filters, tabs, pagination**: URL search params. Never: component state (not shareable)

- Form schemas come from `packages/schemas`; the same schema validates on the client and in the API.
- A form maps `ApiError.fieldErrors` onto its fields with `setError`; the message appears in `FormField`.

```tsx
// WRONG: server data copied into state, goes stale
const { data } = useClients();
const [clients, setClients] = useState(data);

// RIGHT: read from the query; derive in the model
const { data } = useClients();
const rows = useMemo(() => toClientRows(data ?? []), [data]);
```
