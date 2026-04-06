/**
 * Static stand-in: the real title comes from `useOpenDetail` → NDJSON `title` events
 * and shows in `AssistantSidebar`’s header when using `AssistantSidebarShell`.
 */
export const ConversationTitleDemo = () => (
  <div
    className="w-full max-w-[400px] rounded-xl border border-solid bg-white px-4 py-3"
    style={{ borderColor: "var(--opendetail-color-sidebar-stroke)" }}
  >
    <p className="mb-1 font-normal text-[#a4a4a4] text-[11px] uppercase tracking-wide">
      Sidebar header (live)
    </p>
    <p className="font-normal text-[14px] text-neutral-950">
      OpenDetail CLI — build and doctor
    </p>
  </div>
);
