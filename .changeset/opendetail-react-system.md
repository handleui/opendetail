---
"opendetail-react": minor
---

**Component system**

- Add **`ConversationLayout`** (shell, sidebar, and modal variants) and compose it from **`AssistantShell`**, **`AssistantSidebar`**, and **`AssistantModal`**; existing class names and layout behavior are preserved.
- Add **`AssistantSidebar` `connection`** prop (options forwarded to **`useOpenDetail`**). **`AssistantSidebarShell`** is a thin wrapper that passes **`connection`**; existing usage is unchanged.
- Split styles into **`src/styles/systems/opendetail/`** and **`src/styles/themes/opendetail/`**; root **`opendetail-*.css`** files re-export so import paths stay stable.
- Export optional aliases: **`Composer`**, **`UserMessage`**, **`AssistantMessage`** (alongside **`AssistantInput`**, **`AssistantUserMessage`**, **`AssistantResponse`**). Deprecate **`AssistantError`** in favor of assistant message / response error state.
- Add **`data-od-system="opendetail"`** on shell, sidebar, and modal roots where applicable.

**Docs:** new **Systems and themes** doc, `src/styles/README.md`, and package README updates.

**Registry:** add **`conversation-layout`** item; **`assistant-shell`**, **`assistant-modal`**, and **`assistant-sidebar`** depend on it.
