---
"opendetail-react": major
"opendetail-fumadocs": major
---

- **Breaking:** Remove compatibility exports and deprecated components. Public API uses **`Composer`**, **`Thread`**, **`UserMessage`**, **`AssistantMessage`**, **`ConversationLayout`**, and **`AssistantSidebar`** with **`connection`** only—no **`AssistantShell`**, **`AssistantSidebarShell`**, **`AssistantError`**, **`AssistantInput`**, **`AssistantResponse`**, **`AssistantThread`**, **`AssistantUserMessage`**, or **`AssistantLoader`** aliases.
- **`FumadocsAssistant`** now wraps **`AssistantSidebar`** with **`connection`** (same props as before: `endpoint`, `persistence`, `sitePaths`, `transport`).
