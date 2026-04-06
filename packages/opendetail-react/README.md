# opendetail-react

React transport, hooks, components, and styles for OpenDetail.

## Systems and themes

**Systems** are full UI identities (layout, anatomy, default palette). **Themes** are palette layers on top of one system. On the docs site, see **Assistant UI** (`/ui`), the short **Systems and themes** page under `/docs/design-system`, and [`src/styles/README.md`](./src/styles/README.md) for structure and import order.

## Exports

- **Headless:** `useOpenDetail`, `createOpenDetailClient`
- **Layout:** `ConversationLayout` (shell, sidebar, and modal variants)
- **Primitives:** `Composer`, `Thread`, `UserMessage`, `AssistantMessage`, sources helpers
- **Recipes:** `AssistantSidebar` (optional `connection` prop for `useOpenDetail`), `AssistantModal`

## Migration

Internal symbol map for contributors: [`docs/internal/opendetail-react-migration-table.md`](../../docs/internal/opendetail-react-migration-table.md).
