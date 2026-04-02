interface AssistantErrorProps {
  message?: string | null;
}

export const AssistantError = ({
  message = "Assistant error scaffold",
}: AssistantErrorProps) => {
  if (message === null) {
    return null;
  }

  return (
    <p data-opendetail-placeholder="assistant-error" role="alert">
      {message}
    </p>
  );
};
