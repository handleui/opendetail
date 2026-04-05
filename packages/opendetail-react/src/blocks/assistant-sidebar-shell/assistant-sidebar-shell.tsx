"use client";

import { type ReactNode, useState } from "react";
import {
  type UseOpenDetailOptions,
  useOpenDetail,
} from "../../hooks/use-opendetail/use-opendetail";
import {
  AssistantSidebar,
  type AssistantSidebarProps,
} from "../assistant-sidebar/assistant-sidebar";

type AssistantSidebarShellBaseProps = Pick<
  AssistantSidebarProps,
  | "className"
  | "defaultOpen"
  | "emptyState"
  | "hotkeyEnabled"
  | "input"
  | "inputId"
  | "onOpenChange"
  | "open"
  | "placeholder"
  | "promptSuggestions"
  | "renderSourceLink"
  | "resolveSourceTarget"
  | "thread"
  | "userInitial"
>;

export interface AssistantSidebarShellProps
  extends AssistantSidebarShellBaseProps {
  children?: ReactNode;
  endpoint?: UseOpenDetailOptions["endpoint"];
  persistence?: UseOpenDetailOptions["persistence"];
  transport?: UseOpenDetailOptions["transport"];
}

/** Open panel width uses `--opendetail-sidebar-width` in `opendetail-base.css` (target ~375–400px). */
export const AssistantSidebarShell = ({
  children,
  endpoint,
  persistence,
  transport,
  ...sidebarProps
}: AssistantSidebarShellProps) => {
  const [sidebarWidthPx, setSidebarWidthPx] = useState<number | undefined>(
    undefined
  );

  const {
    clearThread,
    conversationTitle,
    messages,
    question,
    setQuestion,
    status,
    stop,
    submit,
  } = useOpenDetail({
    endpoint,
    persistence,
    transport,
  });

  return (
    <AssistantSidebar
      {...sidebarProps}
      headerTitle={conversationTitle}
      messages={messages}
      onClearThread={clearThread}
      onQuestionChange={setQuestion}
      onSidebarWidthChange={setSidebarWidthPx}
      onStop={stop}
      onSubmitQuestion={submit}
      question={question}
      requestState={status}
      sidebarResizeEnabled
      sidebarWidthPx={sidebarWidthPx}
    >
      {children}
    </AssistantSidebar>
  );
};
