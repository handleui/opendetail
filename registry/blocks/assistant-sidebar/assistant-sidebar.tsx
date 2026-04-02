import type { ReactNode } from "react";

import { AssistantError } from "@/registry/ui/assistant-error/assistant-error";
import { AssistantInput } from "@/registry/ui/assistant-input/assistant-input";
import { AssistantResponse } from "@/registry/ui/assistant-response/assistant-response";
import { AssistantShell } from "@/registry/ui/assistant-shell/assistant-shell";
import { AssistantSources } from "@/registry/ui/assistant-sources/assistant-sources";
import { AssistantStatus } from "@/registry/ui/assistant-status/assistant-status";

interface AssistantSidebarProps {
  children?: ReactNode;
}

export const AssistantSidebar = ({ children }: AssistantSidebarProps) => (
  <AssistantShell>
    <AssistantStatus label="Assistant sidebar scaffold" />
    <AssistantResponse>
      {children ?? "Assistant sidebar block placeholder"}
    </AssistantResponse>
    <AssistantSources />
    <AssistantError />
    <AssistantInput />
  </AssistantShell>
);
