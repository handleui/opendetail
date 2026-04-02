export type OpenDetailClientStatus = "idle" | "pending" | "streaming" | "error";

export interface OpenDetailClientOptions {
  endpoint?: string;
}

export interface OpenDetailClientRequest {
  question: string;
}

export interface OpenDetailClientPlaceholder {
  endpoint: string;
  implemented: false;
  status: OpenDetailClientStatus;
  stop: () => void;
  submit: (input: OpenDetailClientRequest) => Promise<void>;
}

const noop = (): void => undefined;
const noopAsync = (_input: OpenDetailClientRequest): Promise<void> =>
  Promise.resolve();

export const createOpenDetailClient = (
  options: OpenDetailClientOptions = {}
): OpenDetailClientPlaceholder => ({
  endpoint: options.endpoint ?? "/api/opendetail",
  status: "idle",
  stop: noop,
  submit: noopAsync,
  implemented: false,
});
