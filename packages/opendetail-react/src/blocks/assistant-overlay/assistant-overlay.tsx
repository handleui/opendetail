import {
  AssistantShell,
  type AssistantShellProps,
} from "../../ui/assistant-shell/assistant-shell";

export interface AssistantOverlayProps extends AssistantShellProps {}

export const AssistantOverlay = (props: AssistantOverlayProps) => (
  <section
    aria-label="OpenDetail assistant overlay"
    data-opendetail-component="assistant-overlay"
  >
    <AssistantShell {...props} />
  </section>
);
