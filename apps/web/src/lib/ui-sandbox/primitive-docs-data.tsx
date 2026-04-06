import type { PrimitiveDocEntry } from "@/lib/ui-sandbox/primitive-doc-types";
import type { SandboxPrimitiveId } from "@/lib/ui-sandbox/primitives";

const PRIMITIVE_DOCS: Record<SandboxPrimitiveId, PrimitiveDocEntry> = {
  shell: {
    title: "Shell",
    description:
      "ConversationLayout (shell variant) is the minimal thread + input layout; AssistantSidebar composes the same primitives with streaming.",
    intro: (
      <p className="text-[14px] text-neutral-600 leading-relaxed">
        <strong className="text-neutral-900">ConversationLayout</strong> with{" "}
        <code className="rounded bg-neutral-100 px-1 py-0.5 text-[13px]">
          variant=&quot;shell&quot;
        </code>{" "}
        pairs the scrollable conversation with the fixed prompt. The live
        preview uses <strong>AssistantSidebar</strong> with{" "}
        <code className="rounded bg-neutral-100 px-1 py-0.5 text-[13px]">
          embedded
        </code>{" "}
        and{" "}
        <code className="rounded bg-neutral-100 px-1 py-0.5 text-[13px]">
          embeddedLayout=&quot;compact&quot;
        </code>
        .
      </p>
    ),
    tables: [
      {
        title: "ConversationLayout (shell)",
        rows: [
          {
            name: "variant",
            type: '"shell"',
            default: "—",
            description: "Required for this layout.",
          },
          {
            name: "input",
            type: "ReactNode",
            default: "—",
            description: "Required. Almost always a Composer.",
          },
          {
            name: "thread",
            type: "ReactNode",
            default: "—",
            description: "Scrollable conversation region.",
          },
          {
            name: "children",
            type: "ReactNode",
            default: "—",
            description:
              "If thread is omitted, children render inside the thread region.",
          },
          {
            name: "className",
            type: "string",
            default: "—",
            description: "Optional class on the root section.",
          },
        ],
      },
      {
        title: "AssistantSidebar — embedded",
        rows: [
          {
            name: "embedded",
            type: "boolean",
            default: "false",
            description:
              "Single-column preview without a main content sibling.",
          },
          {
            name: "embeddedLayout",
            type: '"compact" | "dock"',
            default: '"compact"',
            description:
              "compact — rounded column; dock — flush left column with left border.",
          },
          {
            name: "embeddedHideCollapse",
            type: "boolean",
            default: "false",
            description: "Hide the collapse control (used in this preview).",
          },
        ],
      },
    ],
    seeAlso: [
      { label: "React API", href: "/docs/react" },
      { label: "useOpenDetail", href: "/docs/hooks/use-opendetail" },
    ],
  },
  sidebar: {
    title: "Sidebar",
    description:
      'AssistantSidebar wraps the assistant column, streaming connection, and optional resize — dock preview uses embeddedLayout="dock".',
    tables: [
      {
        title: "Highlights",
        rows: [
          {
            name: "connection",
            type: "ConnectionOptions",
            default: "—",
            description: "Endpoint, persistence, and optional site paths.",
          },
          {
            name: "embeddedLayout",
            type: '"compact" | "dock"',
            default: '"compact"',
            description: "Dock aligns the panel to the preview edge.",
          },
          {
            name: "sidebarResizeEnabled",
            type: "boolean",
            default: "—",
            description: "Optional drag resize for the assistant column.",
          },
        ],
      },
    ],
    seeAlso: [
      { label: "React API", href: "/docs/react" },
      { label: "Packages & composition", href: "/docs/packages" },
    ],
  },
  composer: {
    title: "Composer",
    description:
      "Composable prompt field with submit/stop actions and sizing for sidebar and shell layouts.",
    tables: [
      {
        title: "Props",
        rows: [
          {
            name: "size",
            type: '"compact" | "shell"',
            default: '"compact"',
            description:
              "Layout width — shell matches ConversationLayout shell.",
          },
          {
            name: "requestState",
            type: '"idle" | "pending" | "streaming" | "error"',
            default: '"idle"',
            description: "Drives send vs stop and busy styling.",
          },
          {
            name: "onSubmit",
            type: "function",
            default: "—",
            description: "Called with { question } on submit.",
          },
          {
            name: "value / defaultValue",
            type: "string",
            default: "—",
            description: "Controlled or uncontrolled question text.",
          },
        ],
      },
    ],
    seeAlso: [{ label: "React API", href: "/docs/react" }],
  },
  thread: {
    title: "Thread",
    description:
      "Scrollable list region for user and assistant messages inside the shell layout.",
    tables: [
      {
        title: "Props",
        rows: [
          {
            name: "children",
            type: "ReactNode",
            default: "—",
            description: "Message rows and related UI.",
          },
          {
            name: "className",
            type: "string",
            default: "—",
            description: "Optional root class.",
          },
        ],
      },
    ],
    seeAlso: [{ label: "React API", href: "/docs/react" }],
  },
  "user-message": {
    title: "UserMessage",
    description: "Renders a user turn in the thread with consistent styling.",
    tables: [
      {
        title: "Props",
        rows: [
          {
            name: "children",
            type: "ReactNode",
            default: "—",
            description: "Message content.",
          },
          {
            name: "className",
            type: "string",
            default: "—",
            description: "Optional root class.",
          },
        ],
      },
    ],
    seeAlso: [{ label: "React API", href: "/docs/react" }],
  },
  "assistant-message": {
    title: "AssistantMessage",
    description:
      "Renders the assistant reply: markdown, optional sources, lead, error, and status.",
    tables: [
      {
        title: "Props",
        rows: [
          {
            name: "status",
            type: '"pending" | "streaming" | "complete" | "error"',
            default: "—",
            description: "Streaming state for the message surface.",
          },
          {
            name: "sources",
            type: "AssistantSourceItem[]",
            default: "—",
            description: "Structured sources for citations and footer.",
          },
          {
            name: "renderSourceLink / resolveSourceTarget",
            type: "functions",
            default: "—",
            description: "Safe citation links for local and remote URLs.",
          },
        ],
      },
    ],
    seeAlso: [{ label: "React API", href: "/docs/react" }],
  },
  recommendations: {
    title: "Recommendations",
    description:
      "AssistantSuggestions surfaces prompt chips above the composer.",
    tables: [
      {
        title: "Props",
        rows: [
          {
            name: "suggestions",
            type: "readonly string[] | object",
            default: "—",
            description: "Chip labels shown to the user.",
          },
          {
            name: "onSelect",
            type: "function",
            default: "—",
            description: "Called when a suggestion is chosen.",
          },
        ],
      },
    ],
    seeAlso: [{ label: "React API", href: "/docs/react" }],
  },
  sources: {
    title: "Sources",
    description:
      "AssistantSources renders collapsible source pills; citations in AssistantMessage tie markdown to metadata.",
    tables: [
      {
        title: "AssistantSources",
        rows: [
          {
            name: "items",
            type: "AssistantSourceItem[]",
            default: "—",
            description: "Source rows (id, title, url, kind).",
          },
          {
            name: "open / defaultOpen",
            type: "boolean",
            default: "—",
            description: "Collapsed state.",
          },
          {
            name: "renderSourceLink",
            type: "RenderAssistantSourceLink",
            default: "—",
            description: "e.g. next/link for in-app routes.",
          },
        ],
      },
    ],
    seeAlso: [
      { label: "opendetail-fumadocs", href: "/docs/fumadocs" },
      { label: "React API", href: "/docs/react" },
    ],
  },
  "conversation-title": {
    title: "Conversation title",
    description: "Editable title control for the active conversation thread.",
    tables: [
      {
        title: "Props",
        rows: [
          {
            name: "title",
            type: "string",
            default: "—",
            description: "Displayed title value.",
          },
          {
            name: "onTitleChange",
            type: "(title: string) => void",
            default: "—",
            description: "Persist renamed titles.",
          },
        ],
      },
    ],
    seeAlso: [{ label: "React API", href: "/docs/react" }],
  },
  pressable: {
    title: "Pressable",
    description: "Accessible press target for custom controls and toolbars.",
    tables: [
      {
        title: "Props",
        rows: [
          {
            name: "children",
            type: "ReactNode",
            default: "—",
            description: "Inner content.",
          },
          {
            name: "onPress",
            type: "function",
            default: "—",
            description: "Primary action handler.",
          },
        ],
      },
    ],
    seeAlso: [{ label: "React API", href: "/docs/react" }],
  },
  loader: {
    title: "Loader",
    description:
      "Thinking indicator and loading affordances for assistant state.",
    tables: [
      {
        title: "Props",
        rows: [
          {
            name: "variant",
            type: '"thinking" | "error"',
            default: "—",
            description: "Spinner vs error treatment.",
          },
        ],
      },
    ],
    seeAlso: [{ label: "React API", href: "/docs/react" }],
  },
  error: {
    title: "Error",
    description:
      "Inline error surface for failed requests or assistant errors.",
    tables: [
      {
        title: "Props",
        rows: [
          {
            name: "message",
            type: "string",
            default: "—",
            description: "Error text for the user.",
          },
          {
            name: "onRetry",
            type: "() => void",
            default: "—",
            description: "Optional retry handler.",
          },
        ],
      },
    ],
    seeAlso: [{ label: "React API", href: "/docs/react" }],
  },
};

export function getPrimitiveDoc(id: SandboxPrimitiveId): PrimitiveDocEntry {
  return PRIMITIVE_DOCS[id];
}
