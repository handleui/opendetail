// biome-ignore-all lint/performance/noBarrelFile: package entrypoint defines the public API surface.
export {
  AssistantModal,
  type AssistantModalAssistantMessage,
  type AssistantModalImage,
  type AssistantModalMessage,
  type AssistantModalProps,
  type AssistantModalRequestState,
  type AssistantModalUserMessage,
} from "./blocks/assistant-modal/assistant-modal";
export {
  AssistantSidebar,
  type AssistantSidebarAssistantMessage,
  type AssistantSidebarImage,
  type AssistantSidebarMessage,
  type AssistantSidebarMobileColumn,
  type AssistantSidebarMobileShellSlots,
  type AssistantSidebarProps,
  type AssistantSidebarRequestState,
  type AssistantSidebarUserMessage,
} from "./blocks/assistant-sidebar/assistant-sidebar";
export {
  AssistantSidebarShell,
  type AssistantSidebarShellProps,
} from "./blocks/assistant-sidebar-shell/assistant-sidebar-shell";
export {
  type OpenDetailAssistantMessage,
  type OpenDetailPersistenceOptions,
  type OpenDetailPersistenceStorage,
  type OpenDetailThreadMessage,
  type OpenDetailUserMessage,
  type UseOpenDetailOptions,
  type UseOpenDetailState,
  useOpenDetail,
} from "./hooks/use-opendetail/use-opendetail";
export {
  createOpenDetailClient,
  type OpenDetailClient,
  type OpenDetailClientDoneEvent,
  type OpenDetailClientErrorCode,
  type OpenDetailClientErrorEvent,
  type OpenDetailClientHandlers,
  type OpenDetailClientImage,
  type OpenDetailClientImagesEvent,
  type OpenDetailClientMetaEvent,
  type OpenDetailClientOptions,
  type OpenDetailClientRequest,
  type OpenDetailClientSource,
  type OpenDetailClientSourcesEvent,
  type OpenDetailClientStatus,
  type OpenDetailClientStreamEvent,
  type OpenDetailClientTitleEvent,
  type OpenDetailTransportOptions,
} from "./lib/opendetail-client/opendetail-client";
export {
  AssistantError,
  type AssistantErrorProps,
} from "./ui/assistant-error/assistant-error";
export {
  AssistantInput,
  type AssistantInputProps,
  type AssistantInputRequest,
} from "./ui/assistant-input/assistant-input";
export {
  AssistantResponse,
  type AssistantResponseImage,
  type AssistantResponseMeta,
  type AssistantResponseProps,
  getSourcesCitedInContent,
} from "./ui/assistant-response/assistant-response";
export {
  AssistantShell,
  type AssistantShellProps,
} from "./ui/assistant-shell/assistant-shell";
export {
  AssistantSources,
  type AssistantSourcesProps,
} from "./ui/assistant-sources/assistant-sources";
export {
  type AssistantSourceItem,
  type AssistantSourceTarget,
  getDefaultAssistantSourceTarget,
  isSafeAssistantSourceHref,
  type RenderAssistantSourceLink,
  type RenderAssistantSourceLinkProps,
  type ResolveAssistantSourceTarget,
  renderAssistantSourceLink,
  resolveAssistantSourceTarget,
} from "./ui/assistant-sources/source-links";
export {
  AssistantStatus,
  AssistantStatus as AssistantLoader,
  type AssistantStatusProps,
  type AssistantStatusProps as AssistantLoaderProps,
} from "./ui/assistant-status/assistant-status";
export {
  AssistantSuggestion,
  type AssistantSuggestionProps,
  AssistantSuggestions,
  type AssistantSuggestionsProps,
} from "./ui/assistant-suggestions/assistant-suggestions";
export {
  AssistantThread,
  type AssistantThreadProps,
} from "./ui/assistant-thread/assistant-thread";
export {
  AssistantUserMessage,
  type AssistantUserMessageProps,
} from "./ui/assistant-user-message/assistant-user-message";
