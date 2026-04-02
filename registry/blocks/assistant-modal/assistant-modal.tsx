import type { ReactNode } from "react";

import { AssistantError } from "@/registry/ui/assistant-error/assistant-error";
import { AssistantInput } from "@/registry/ui/assistant-input/assistant-input";
import { AssistantResponse } from "@/registry/ui/assistant-response/assistant-response";
import { AssistantShell } from "@/registry/ui/assistant-shell/assistant-shell";
import { AssistantSources } from "@/registry/ui/assistant-sources/assistant-sources";
import { AssistantStatus } from "@/registry/ui/assistant-status/assistant-status";

interface AssistantModalProps {
  children?: ReactNode;
}

export const AssistantModal = ({ children }: AssistantModalProps) => (
  <AssistantShell>
    <AssistantStatus label="Assistant modal scaffold" />
    <AssistantResponse>
      {children ?? "Assistant modal block placeholder"}
    </AssistantResponse>
    <AssistantSources />
    <AssistantError />
    <AssistantInput />
  </AssistantShell>
);
