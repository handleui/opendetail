import { AssistantStatus } from "../assistant-status/assistant-status";

export interface AssistantErrorProps {
  label?: string;
  message?: string | null;
}

export const AssistantError = ({
  label,
  message = "Ouch, please try again",
}: AssistantErrorProps) => {
  if (message === null) {
    return null;
  }

  return <AssistantStatus label={label ?? message} variant="error" />;
};
