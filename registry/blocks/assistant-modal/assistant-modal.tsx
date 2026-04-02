import {
  AssistantShell,
  type AssistantShellProps,
} from "../../ui/assistant-shell/assistant-shell";

export interface AssistantModalProps extends AssistantShellProps {}

export const AssistantModal = (props: AssistantModalProps) => (
  <section
    aria-label="OpenDetail assistant modal"
    data-opendetail-component="assistant-modal"
  >
    <AssistantShell {...props} />
  </section>
);
