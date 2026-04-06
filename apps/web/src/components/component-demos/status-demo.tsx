"use client";

import { AssistantStatus } from "opendetail-react";

export const StatusDemo = () => (
  <div className="flex w-full max-w-[400px] flex-col gap-6">
    <AssistantStatus variant="thinking" />
    <AssistantStatus label="Custom status copy" variant="thinking" />
  </div>
);
