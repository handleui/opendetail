import { Loader, X } from "lucide-react";
import type { CSSProperties } from "react";

export type AssistantStatusVariant = "thinking" | "error";

export interface AssistantStatusProps {
  label?: string;
  variant: AssistantStatusVariant;
}

const defaultLabels: Record<AssistantStatusVariant, string> = {
  thinking: "Thinking",
  error: "Ouch, please try again",
};

const thinkingShimmerStyle: CSSProperties = {
  ["--shimmer-color" as string]: "#080808",
  ["--shimmer-speed" as string]: "120",
  ["--shimmer-spread" as string]: "6ch",
  ["--shimmer-width" as string]: "120",
};

export const AssistantStatus = ({ label, variant }: AssistantStatusProps) => {
  const isError = variant === "error";
  const Icon = isError ? X : Loader;

  return (
    <div
      aria-live={isError ? "assertive" : "polite"}
      className={[
        "flex h-6 items-center gap-2 rounded-full border px-2.5",
        isError ? "border-red-600" : "border-zinc-100",
      ].join(" ")}
      data-opendetail-placeholder="assistant-status"
      role={isError ? "alert" : "status"}
    >
      <Icon
        aria-hidden="true"
        className={isError ? "size-3 text-red-600" : "size-2.5 text-black"}
        strokeWidth={2}
      />
      <span
        className={[
          "font-normal text-xs leading-4 tracking-[-0.04em]",
          isError ? "text-red-600" : "shimmer text-zinc-400",
        ].join(" ")}
        style={isError ? undefined : thinkingShimmerStyle}
      >
        {label ?? defaultLabels[variant]}
      </span>
    </div>
  );
};
