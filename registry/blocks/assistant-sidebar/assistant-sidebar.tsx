import {
  AssistantShell,
  type AssistantShellProps,
} from "../../ui/assistant-shell/assistant-shell";

export interface AssistantSidebarProps extends AssistantShellProps {}

export const AssistantSidebar = (props: AssistantSidebarProps) => (
  <section
    aria-label="OpenDetail assistant sidebar"
    data-opendetail-component="assistant-sidebar"
  >
    <AssistantShell {...props} />
  </section>
);
