# opendetail-react

React transport, hooks, components, and styles for OpenDetail.

## Systems and themes

**Systems** are full UI identities (layout, anatomy, default palette). **Themes** are palette layers on top of one system. See `apps/web/content/docs/design-system.mdx` in the repo (published under **Documentation → Systems and themes**) and [`src/styles/README.md`](./src/styles/README.md) for structure, import order, and how to add a theme or a new system.

## Exports

- **Headless:** `useOpenDetail`, `createOpenDetailClient`
- **Layout:** `ConversationLayout` (shell, sidebar, and modal variants)
- **Primitives:** `Composer`, `Thread`, `UserMessage`, `AssistantMessage`, sources helpers
- **Recipes:** `AssistantSidebar` (optional `connection` prop for `useOpenDetail`), `AssistantModal`

## Migration

Internal symbol map for contributors: [`docs/internal/opendetail-react-migration-table.md`](../../docs/internal/opendetail-react-migration-table.md).
