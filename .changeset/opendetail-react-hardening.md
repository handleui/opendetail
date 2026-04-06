---
"opendetail-react": patch
---

- **Security:** Reject protocol-relative source URLs (`//host/...`) in `getDefaultAssistantSourceTarget` and `isSafeAssistantSourceHref` so local/path citations cannot navigate off-site.
- **Performance:** Stable `useOpenDetail` callbacks (`clearThread`, `stop`, `submit`) via ref indirection; `AssistantSidebar` uses `onOpenChangeRef` for global listeners, memoized mobile `setColumn`, and a stable default input submit handler; `AssistantModal` uses stable dialog ref and submit handler, and `onOpenChangeRef` for open effects; `AssistantSidebarShell` memoizes the `connection` object.
