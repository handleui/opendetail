export type OpenDetailClientStatus = "idle" | "pending" | "streaming" | "error";

export interface OpenDetailClientOptions {
  endpoint?: string;
}

export interface OpenDetailClientPlaceholder {
  endpoint: string;
  implemented: false;
  status: OpenDetailClientStatus;
}

export const createOpenDetailClient = (
  options: OpenDetailClientOptions = {}
): OpenDetailClientPlaceholder => ({
  endpoint: options.endpoint ?? "/api/opendetail",
  status: "idle",
  implemented: false,
});
