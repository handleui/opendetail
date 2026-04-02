"use client";

import { useState } from "react";

import { AssistantInput } from "@/registry/ui/assistant-input/assistant-input";
import { AssistantResponse } from "@/registry/ui/assistant-response/assistant-response";
import { AssistantShell } from "@/registry/ui/assistant-shell/assistant-shell";
import { AssistantThread } from "@/registry/ui/assistant-thread/assistant-thread";
import { AssistantUserMessage } from "@/registry/ui/assistant-user-message/assistant-user-message";

const sources = [
  {
    id: "argus",
    title: "Argus overview",
    url: "/docs/argus",
  },
  {
    id: "helios",
    title: "Helios deployment notes",
    url: "/docs/helios",
  },
  {
    id: "chronos",
    title: "Chronos query optimization report",
    url: "/docs/chronos",
  },
  {
    id: "portfolio",
    title: "Rodrigo portfolio summary",
    url: "/docs/portfolio",
  },
] as const;

const question =
  "Could you please provide a detailed breakdown of all projects Rodrigo has actively contributed to? Along with relevant achievements";

const answerLead = "Sure. Here’s a quick overview on the Rodrigo portfolio.";

const answerBody =
  "Over the past three months, Rodrigo has been instrumental in several key projects. In 'Argus', he focused on enhancing real-time data visualization, overcoming challenges related to high-volume data streams. For 'Helios', Rodrigo automated deployment workflows, tackling issues of cross-platform compatibility. Lastly, in 'Chronos', he optimized query performance, resolving bottlenecks in data retrieval processes.";

export default function DemoPage() {
  const [value, setValue] = useState("");

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-10">
      <AssistantShell
        input={
          <AssistantInput
            onValueChange={setValue}
            placeholder="What has Rodrigo worked on?"
            size="shell"
            value={value}
          />
        }
        thread={
          <AssistantThread animated>
            <AssistantUserMessage initial="R">{question}</AssistantUserMessage>

            <AssistantResponse
              defaultSourcesOpen={false}
              image={{
                alt: "Portfolio project preview placeholder",
                placeholder: true,
              }}
              lead={answerLead}
              meta={{
                durationLabel: "3s",
                sourceCount: sources.length,
              }}
              sources={[...sources]}
            >
              {answerBody}
            </AssistantResponse>
          </AssistantThread>
        }
      />
    </main>
  );
}
