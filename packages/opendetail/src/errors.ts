import type { OpenDetailErrorCode, OpenDetailPublicError } from "./types";

export const NODE_RUNTIME_REQUIRED_MESSAGE =
  'OpenDetail requires the Node.js runtime. In Next.js route handlers, add `export const runtime = "nodejs"`.';
export const INCOMPLETE_RESPONSE_MESSAGE =
  "The model could not complete the answer.";
export const CONTENT_FILTERED_RESPONSE_MESSAGE =
  "The model could not complete the answer because the response was filtered.";
export const MAX_OUTPUT_TOKENS_RESPONSE_MESSAGE =
  "The model could not complete the answer before reaching the output token limit.";
export const OPENDETAIL_RUNTIME_FAILURE_MESSAGE =
  "OpenDetail could not complete the request.";
export const MISSING_API_KEY_MESSAGE = "OPENAI_API_KEY is required at runtime.";
const OPENAI_PROVIDER_NAME = "openai";

const PUBLIC_ERROR_DEFAULTS = {
  invalid_request: {
    message: "OpenDetail received an invalid request.",
    param: null,
    provider: null,
    providerCode: null,
    requestId: null,
    retryable: false,
    status: null,
  },
  invalid_runtime: {
    message: NODE_RUNTIME_REQUIRED_MESSAGE,
    param: null,
    provider: null,
    providerCode: null,
    requestId: null,
    retryable: false,
    status: null,
  },
  method_not_allowed: {
    message:
      "Method not allowed. Use POST with a JSON body shaped like { question: string }.",
    param: null,
    provider: null,
    providerCode: null,
    requestId: null,
    retryable: false,
    status: null,
  },
  missing_api_key: {
    message: MISSING_API_KEY_MESSAGE,
    param: null,
    provider: null,
    providerCode: null,
    requestId: null,
    retryable: false,
    status: null,
  },
  missing_index: {
    message:
      "OpenDetail index is missing. Run `npx opendetail build` before starting the production server. The default location is `.opendetail/index.json`.",
    param: null,
    provider: null,
    providerCode: null,
    requestId: null,
    retryable: false,
    status: null,
  },
  model_incomplete: {
    message: INCOMPLETE_RESPONSE_MESSAGE,
    param: null,
    provider: null,
    providerCode: null,
    requestId: null,
    retryable: false,
    status: null,
  },
  provider_auth: {
    message: "OpenAI rejected the request.",
    param: null,
    provider: OPENAI_PROVIDER_NAME,
    providerCode: null,
    requestId: null,
    retryable: false,
    status: 401,
  },
  provider_invalid_request: {
    message: "OpenAI rejected the request payload.",
    param: null,
    provider: OPENAI_PROVIDER_NAME,
    providerCode: null,
    requestId: null,
    retryable: false,
    status: 400,
  },
  provider_rate_limited: {
    message: "OpenAI rate limited the request.",
    param: null,
    provider: OPENAI_PROVIDER_NAME,
    providerCode: null,
    requestId: null,
    retryable: true,
    status: 429,
  },
  provider_unavailable: {
    message: "OpenAI could not complete the request.",
    param: null,
    provider: OPENAI_PROVIDER_NAME,
    providerCode: null,
    requestId: null,
    retryable: true,
    status: 500,
  },
  request_failed: {
    message: OPENDETAIL_RUNTIME_FAILURE_MESSAGE,
    param: null,
    provider: null,
    providerCode: null,
    requestId: null,
    retryable: false,
    status: null,
  },
} as const satisfies Record<
  OpenDetailErrorCode,
  {
    message: string;
    param: string | null;
    provider: "openai" | null;
    providerCode: string | null;
    requestId: string | null;
    retryable: boolean;
    status: number | null;
  }
>;

export class OpenDetailError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "OpenDetailError";
  }
}

export class OpenDetailConfigError extends OpenDetailError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "OpenDetailConfigError";
  }
}

export class OpenDetailIndexNotFoundError extends OpenDetailError {
  readonly indexPath: string;

  constructor(indexPath: string) {
    super(
      `OpenDetail index not found at ${indexPath}. Run \`npx opendetail build\` first.`
    );

    this.indexPath = indexPath;
    this.name = "OpenDetailIndexNotFoundError";
  }
}

export class OpenDetailMissingApiKeyError extends OpenDetailConfigError {
  constructor() {
    super(MISSING_API_KEY_MESSAGE);
    this.name = "OpenDetailMissingApiKeyError";
  }
}

export class OpenDetailInvalidRuntimeError extends OpenDetailError {
  constructor() {
    super(NODE_RUNTIME_REQUIRED_MESSAGE);
    this.name = "OpenDetailInvalidRuntimeError";
  }
}

export class OpenDetailModelIncompleteError extends OpenDetailError {
  constructor(message: string) {
    super(message);
    this.name = "OpenDetailModelIncompleteError";
  }
}

export const createOpenDetailPublicError = (
  code: OpenDetailErrorCode,
  overrides: Partial<Omit<OpenDetailPublicError, "code">> = {}
): OpenDetailPublicError => ({
  code,
  message: overrides.message ?? PUBLIC_ERROR_DEFAULTS[code].message,
  param: overrides.param ?? PUBLIC_ERROR_DEFAULTS[code].param,
  provider: overrides.provider ?? PUBLIC_ERROR_DEFAULTS[code].provider,
  providerCode:
    overrides.providerCode ?? PUBLIC_ERROR_DEFAULTS[code].providerCode,
  requestId: overrides.requestId ?? PUBLIC_ERROR_DEFAULTS[code].requestId,
  retryable: overrides.retryable ?? PUBLIC_ERROR_DEFAULTS[code].retryable,
  status: overrides.status ?? PUBLIC_ERROR_DEFAULTS[code].status,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getStringValue = (
  value: Record<string, unknown>,
  key: string
): string | null => {
  const candidate = value[key];
  return typeof candidate === "string" && candidate.length > 0
    ? candidate
    : null;
};

const getNumberValue = (
  value: Record<string, unknown>,
  key: string
): number | null => {
  const candidate = value[key];
  return typeof candidate === "number" ? candidate : null;
};

const getFirstString = (...values: Array<string | null>): string | null =>
  values.find((value) => value !== null) ?? null;

const getFirstNumber = (...values: Array<number | null>): number | null =>
  values.find((value) => value !== null) ?? null;

const getNestedProviderErrorRecords = (value: Record<string, unknown>) => {
  const nestedError = isRecord(value.error) ? value.error : null;
  const responseRecord = isRecord(value.response) ? value.response : null;
  const responseError =
    responseRecord && isRecord(responseRecord.error)
      ? responseRecord.error
      : null;

  return {
    nestedError,
    responseError,
  };
};

const getProviderField = (
  key: string,
  value: Record<string, unknown>,
  nestedError: Record<string, unknown> | null,
  responseError: Record<string, unknown> | null
): string | null =>
  getFirstString(
    getStringValue(value, key),
    nestedError ? getStringValue(nestedError, key) : null,
    responseError ? getStringValue(responseError, key) : null
  );

const getProviderStatus = (
  value: Record<string, unknown>,
  nestedError: Record<string, unknown> | null,
  responseError: Record<string, unknown> | null
): number | null =>
  getFirstNumber(
    getNumberValue(value, "status"),
    nestedError ? getNumberValue(nestedError, "status") : null,
    responseError ? getNumberValue(responseError, "status") : null
  );

const getProviderErrorCode = (status: number | null): OpenDetailErrorCode => {
  if (status === 400 || status === 404 || status === 409 || status === 422) {
    return "provider_invalid_request";
  }

  if (status === 401 || status === 403) {
    return "provider_auth";
  }

  if (status === 429) {
    return "provider_rate_limited";
  }

  if (status !== null && status >= 500) {
    return "provider_unavailable";
  }

  return "request_failed";
};

const getRetryableFromStatus = (status: number | null): boolean =>
  status === 429 || (status !== null && status >= 500);

const toOpenAIPublicError = (
  value: Record<string, unknown>
): OpenDetailPublicError | null => {
  const { nestedError, responseError } = getNestedProviderErrorRecords(value);
  const resolvedMessage = getProviderField(
    "message",
    value,
    nestedError,
    responseError
  );

  if (resolvedMessage === null) {
    return null;
  }

  const status = getProviderStatus(value, nestedError, responseError);
  const providerCode = getProviderField(
    "code",
    value,
    nestedError,
    responseError
  );
  const param = getProviderField("param", value, nestedError, responseError);
  const requestId = getProviderField(
    "requestID",
    value,
    nestedError,
    responseError
  );
  const code = getProviderErrorCode(status);
  const provider =
    status !== null ||
    providerCode !== null ||
    param !== null ||
    requestId !== null
      ? OPENAI_PROVIDER_NAME
      : null;

  return createOpenDetailPublicError(code, {
    message: resolvedMessage,
    param,
    provider,
    providerCode,
    requestId,
    retryable:
      code === "request_failed" ? false : getRetryableFromStatus(status),
    status,
  });
};

export const toOpenDetailPublicError = (
  error: unknown
): OpenDetailPublicError => {
  if (error instanceof OpenDetailMissingApiKeyError) {
    return createOpenDetailPublicError("missing_api_key");
  }

  if (error instanceof OpenDetailIndexNotFoundError) {
    return createOpenDetailPublicError("missing_index");
  }

  if (error instanceof OpenDetailInvalidRuntimeError) {
    return createOpenDetailPublicError("invalid_runtime");
  }

  if (error instanceof OpenDetailModelIncompleteError) {
    return createOpenDetailPublicError("model_incomplete", {
      message: error.message,
    });
  }

  if (isRecord(error)) {
    const publicError = toOpenAIPublicError(error);

    if (publicError) {
      return publicError;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return createOpenDetailPublicError("request_failed", {
      message: error.message,
    });
  }

  return createOpenDetailPublicError("request_failed");
};
