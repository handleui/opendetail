import { AssistantMessageDemo } from "@/components/component-demos/assistant-message-demo";
import { ConversationTitleDemo } from "@/components/component-demos/conversation-title-demo";
import { ErrorDemo } from "@/components/component-demos/error-demo";
import { InputDemo } from "@/components/component-demos/input-demo";
import { LoaderDemo } from "@/components/component-demos/loader-demo";
import { PressableDemo } from "@/components/component-demos/pressable-demo";
import { ShellDemo } from "@/components/component-demos/shell-demo";
import { SidebarDemo } from "@/components/component-demos/sidebar-demo";
import { SourcesDemo } from "@/components/component-demos/sources-demo";
import { SuggestionsDemo } from "@/components/component-demos/suggestions-demo";
import { ThreadDemo } from "@/components/component-demos/thread-demo";
import { UserMessageDemo } from "@/components/component-demos/user-message-demo";
import type { SandboxPrimitiveId } from "@/lib/ui-sandbox/primitives";

export function SandboxPrimitiveDemo({
  knownSourcePageUrls,
  primitive,
}: {
  knownSourcePageUrls: readonly string[];
  primitive: SandboxPrimitiveId;
}) {
  switch (primitive) {
    case "conversation-title":
      return <ConversationTitleDemo />;
    case "error":
      return <ErrorDemo />;
    case "composer":
      return <InputDemo />;
    case "loader":
      return <LoaderDemo />;
    case "pressable":
      return <PressableDemo />;
    case "recommendations":
      return <SuggestionsDemo />;
    case "shell":
      return <ShellDemo knownSourcePageUrls={knownSourcePageUrls} />;
    case "sidebar":
      return <SidebarDemo knownSourcePageUrls={knownSourcePageUrls} />;
    case "sources":
      return <SourcesDemo />;
    case "thread":
      return <ThreadDemo />;
    case "user-message":
      return <UserMessageDemo />;
    case "assistant-message":
      return <AssistantMessageDemo />;
    default:
      return null;
  }
}
