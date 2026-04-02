export type AssistantStatusVariant = "thinking" | "error";

export interface AssistantStatusProps {
  id?: string;
  label?: string;
  variant: AssistantStatusVariant;
}

const defaultLabels: Record<AssistantStatusVariant, string> = {
  thinking: "Thinking",
  error: "Ouch, please try again",
};

export const AssistantStatus = ({
  id,
  label,
  variant,
}: AssistantStatusProps) => {
  const isError = variant === "error";
  const resolvedLabel = label ?? defaultLabels[variant];

  return (
    <div
      aria-live={isError ? "assertive" : "polite"}
      className={
        isError
          ? "opendetail-status opendetail-status--error"
          : "opendetail-status"
      }
      data-opendetail-placeholder="assistant-status"
      id={id}
      role={isError ? "alert" : "status"}
    >
      {isError ? (
        <span className="opendetail-status__label">{resolvedLabel}</span>
      ) : (
        <>
          <span aria-hidden="true" className="opendetail-status__loader" />
          <span className="sr-only">{resolvedLabel}</span>
        </>
      )}
    </div>
  );
};
