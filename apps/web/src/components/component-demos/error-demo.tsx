"use client";

import { AssistantStatus } from "opendetail-react";

export const ErrorDemo = () => (
  <div className="w-full max-w-[400px]">
    <AssistantStatus label="Request failed — try again." variant="error" />
  </div>
);
