# opendetail-react

React hooks, components, and styles for OpenDetail.

## Styling

**Systems** are full UI identities (layout, anatomy, default palette). **Themes** are palette layers on top of one system. Public docs for the React integration live at `/docs/react`, and [`src/styles/README.md`](./src/styles/README.md) covers the style structure and import order in this package.

## Exports

- **React state:** `useOpenDetail`
- **Layout:** `ConversationLayout` (shell, sidebar, and modal variants)
- **Primitives:** `Composer`, `Thread`, `UserMessage`, `AssistantMessage`, sources helpers
- **Recipes:** `AssistantSidebar` (optional `connection` prop for `useOpenDetail`), `AssistantModal`

If you only need the transport client, use `opendetail-client`.

## Migration

Internal symbol map for contributors: [`docs/internal/opendetail-react-migration-table.md`](../../docs/internal/opendetail-react-migration-table.md).
