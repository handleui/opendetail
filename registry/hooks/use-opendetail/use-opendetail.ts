"use client";

import type {
  OpenDetailClientRequest,
  OpenDetailClientStatus,
} from "../../lib/opendetail-client/opendetail-client";

export interface UseOpenDetailState {
  error: string | null;
  implemented: false;
  question: string;
  setQuestion: (value: string) => void;
  status: OpenDetailClientStatus;
  stop: () => void;
  submit: (request?: OpenDetailClientRequest) => Promise<void>;
}

const noop = (): void => undefined;
const noopAsync = (_request?: OpenDetailClientRequest): Promise<void> =>
  Promise.resolve();

const PLACEHOLDER_STATE: UseOpenDetailState = {
  error: null,
  implemented: false,
  question: "",
  setQuestion: noop,
  status: "idle",
  stop: noop,
  submit: noopAsync,
};

export const useOpenDetail = (): UseOpenDetailState => PLACEHOLDER_STATE;
