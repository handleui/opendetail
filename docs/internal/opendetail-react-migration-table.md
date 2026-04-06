# OpenDetail React — symbol migration (component system redesign)

Internal reference for contributors. **Release notes** are generated via [Changesets](https://github.com/changesets/changesets) (`bun run changeset`).

| Previous (removed) | Current | Notes |
| ------------------ | ------- | ----- |
| `AssistantShell` | `ConversationLayout` (`variant="shell"`) | No compatibility export. |
| `AssistantSidebarShell` | `AssistantSidebar` + `connection` | Wire `endpoint`, `persistence`, `sitePaths`, `transport` via `connection`. |
| `AssistantInput` | `Composer` | Types: `ComposerProps`, `ComposerRequest`, `ComposerStatus`. |
| `AssistantUserMessage` | `UserMessage` | |
| `AssistantResponse` | `AssistantMessage` | Types: `AssistantMessageProps`, `AssistantMessageImage`, `AssistantMessageMeta`. |
| `AssistantThread` | `Thread` | |
| `AssistantError` | `AssistantStatus` (`variant="error"`) or `AssistantMessage` error state | |
| `AssistantLoader` | `AssistantStatus` (`variant="thinking"`) | |

## Security note (sources)

Protocol-relative URLs (`//host/path`) are rejected for local/path source targets and in `isSafeAssistantSourceHref` to prevent link hijacking.

## Webapp regression checklist (manual)

After changes touching sidebar, modal, or styles:

- [ ] Sidebar: ⌘/Ctrl+J toggles; Escape closes when open
- [ ] Sidebar resize handle (desktop); width within bounds
- [ ] Mobile triptych: nav / main / assistant columns switch correctly
- [ ] Modal: focus trap, Escape, close button; thread opens on new message
- [ ] Streaming and error states render without layout shift
- [ ] Docs previews: shell demo, sidebar demo match prior appearance
