"use client";

import type { ReactNode } from "react";
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

export const AssistantSidebarShell = ({
  children,
  endpoint,
  persistence,
  transport,
  ...sidebarProps
}: AssistantSidebarShellProps) => {
  const { clearThread, messages, question, setQuestion, status, stop, submit } =
    useOpenDetail({
      endpoint,
      persistence,
      transport,
    });

  return (
    <AssistantSidebar
      messages={messages}
      onClearThread={clearThread}
      onQuestionChange={setQuestion}
      onStop={stop}
      onSubmitQuestion={submit}
      question={question}
      requestState={status}
      {...sidebarProps}
    >
      {children}
    </AssistantSidebar>
  );
};
