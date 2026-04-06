/** Slugs supported by the UI sandbox iframe and registry. */
export const SANDBOX_PRIMITIVE_IDS = [
  "shell",
  "sidebar",
  "composer",
  "thread",
  "user-message",
  "assistant-message",
  "recommendations",
  "sources",
  "conversation-title",
  "pressable",
  "loader",
  "error",
] as const;

export type SandboxPrimitiveId = (typeof SANDBOX_PRIMITIVE_IDS)[number];

export function isSandboxPrimitiveId(
  value: string
): value is SandboxPrimitiveId {
  return (SANDBOX_PRIMITIVE_IDS as readonly string[]).includes(value);
}

export type SandboxThemeId = "default" | "midnight" | "signal";

export const SANDBOX_THEME_IDS: readonly SandboxThemeId[] = [
  "default",
  "midnight",
  "signal",
] as const;

export type SandboxSystemId = "opendetail";

export const SANDBOX_SYSTEM_IDS: readonly SandboxSystemId[] = [
  "opendetail",
] as const;

export const PRIMITIVE_LABELS: Record<SandboxPrimitiveId, string> = {
  shell: "Shell",
  sidebar: "Sidebar",
  composer: "Composer",
  thread: "Thread",
  "user-message": "User message",
  "assistant-message": "Assistant message",
  recommendations: "Recommendations",
  sources: "Sources",
  "conversation-title": "Conversation title",
  pressable: "Pressable",
  loader: "Loader",
  error: "Error",
};

export const THEME_LABELS: Record<SandboxThemeId, string> = {
  default: "Default",
  midnight: "Midnight",
  signal: "Signal",
};

export const SYSTEM_LABELS: Record<SandboxSystemId, string> = {
  opendetail: "OpenDetail",
};
