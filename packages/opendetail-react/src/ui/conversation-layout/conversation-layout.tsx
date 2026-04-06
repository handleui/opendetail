import type { ReactNode } from "react";

const SHELL_ROOT = "opendetail-shell";
const SHELL_THREAD = "opendetail-shell__thread";
const SHELL_INPUT = "opendetail-shell__input";

interface ConversationLayoutShellProps {
  children?: ReactNode;
  className?: string;
  /** `data-od-system` on the root section (OpenDetail design system). */
  dataOdSystem?: string;
  input: ReactNode;
  thread?: ReactNode;
  variant: "shell";
}

interface ConversationLayoutSidebarProps {
  body: ReactNode;
  bodyClassName: string;
  input: ReactNode;
  variant: "sidebar";
}

interface ConversationLayoutModalProps {
  input: ReactNode;
  modalShowThread: boolean;
  thread: ReactNode;
  variant: "modal";
}

export type ConversationLayoutProps =
  | ConversationLayoutShellProps
  | ConversationLayoutSidebarProps
  | ConversationLayoutModalProps;

/**
 * Shared conversation regions (thread/body + composer) for shell, sidebar, and modal.
 * Preserves existing BEM class names so CSS and layout stay pixel-stable.
 */
export const ConversationLayout = (
  props: ConversationLayoutProps
): ReactNode => {
  if (props.variant === "shell") {
    const {
      children,
      className,
      dataOdSystem = "opendetail",
      input,
      thread,
    } = props;

    return (
      <section
        aria-label="OpenDetail assistant shell"
        className={[SHELL_ROOT, className].filter(Boolean).join(" ")}
        data-od-system={dataOdSystem}
      >
        <div className={SHELL_THREAD}>{thread ?? children ?? null}</div>
        <div className={SHELL_INPUT}>{input}</div>
      </section>
    );
  }

  if (props.variant === "sidebar") {
    const { body, bodyClassName, input } = props;

    return (
      <>
        <div className={bodyClassName}>{body}</div>
        <div className="opendetail-sidebar__input">{input}</div>
      </>
    );
  }

  const { input, modalShowThread, thread } = props;

  return (
    <>
      {modalShowThread ? (
        <div className="opendetail-modal__thread-layer">{thread}</div>
      ) : null}
      <div className="opendetail-modal__input-layer">{input}</div>
    </>
  );
};
