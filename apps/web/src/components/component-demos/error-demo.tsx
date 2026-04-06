"use client";

import { AssistantError } from "opendetail-react";

export const ErrorDemo = () => (
  <div className="w-full max-w-[400px]">
    <AssistantError message="Request failed — try again." />
  </div>
);
