"use client";

import { useOpenDetail } from "@/registry/hooks/use-opendetail/use-opendetail";
import { AssistantInput } from "@/registry/ui/assistant-input/assistant-input";
import { AssistantResponse } from "@/registry/ui/assistant-response/assistant-response";
import { AssistantShell } from "@/registry/ui/assistant-shell/assistant-shell";
import { AssistantThread } from "@/registry/ui/assistant-thread/assistant-thread";
import { AssistantUserMessage } from "@/registry/ui/assistant-user-message/assistant-user-message";

const RESPONSE_BREAK_REGEX = /\n{2,}/u;

const splitResponseText = (
  text: string
): {
  body: string | null;
  lead: string | null;
} => {
  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    return {
      body: null,
      lead: null,
    };
  }

  const [lead, ...rest] = trimmedText.split(RESPONSE_BREAK_REGEX);

  return {
    body: rest.length > 0 ? rest.join("\n\n") : null,
    lead,
  };
};

export default function TestPage() {
  const { error, messages, question, setQuestion, status, stop, submit } =
    useOpenDetail();

  return (
    <main className="min-h-screen bg-white px-6">
      <AssistantShell
        className="min-h-screen pb-40"
        input={<div aria-hidden="true" className="h-px w-full opacity-0" />}
        thread={
          <AssistantThread animated={messages.length > 0}>
            {messages.map((message) => {
              if (message.role === "user") {
                return (
                  <AssistantUserMessage initial="U" key={message.id}>
                    {message.question}
                  </AssistantUserMessage>
                );
              }

              const { body, lead } = splitResponseText(message.text);
              const primaryImage =
                message.status === "complete" ? message.images[0] : undefined;
              const fallbackLead =
                lead ??
                (message.status === "error"
                  ? (message.error ?? error ?? "OpenDetail request failed.")
                  : "Searching the docs...");

              return (
                <AssistantResponse
                  image={
                    primaryImage
                      ? {
                          alt:
                            primaryImage.alt ??
                            primaryImage.title ??
                            "Retrieved documentation reference",
                          src: primaryImage.url,
                        }
                      : null
                  }
                  key={message.id}
                  lead={fallbackLead}
                  meta={{
                    durationLabel: message.durationLabel ?? undefined,
                    sourceCount: message.sources.length,
                  }}
                  sources={message.sources}
                >
                  {body}
                </AssistantResponse>
              );
            })}
          </AssistantThread>
        }
      />

      <div className="fixed right-6 bottom-8 left-6 z-20 flex justify-center">
        <AssistantInput
          onStop={stop}
          onSubmit={(request) => submit(request)}
          onValueChange={(value) => {
            setQuestion(value);
          }}
          placeholder="Ask about the product docs or the visual references"
          requestState={status}
          size="shell"
          status={error ? { label: error, variant: "error" } : null}
          value={question}
        />
      </div>
    </main>
  );
}
