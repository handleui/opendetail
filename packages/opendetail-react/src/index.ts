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
  type AssistantSidebarConnectionOptions,
  type AssistantSidebarImage,
  type AssistantSidebarMessage,
  type AssistantSidebarMobileColumn,
  type AssistantSidebarMobileShellSlots,
  type AssistantSidebarProps,
  type AssistantSidebarRequestState,
  type AssistantSidebarUserMessage,
} from "./blocks/assistant-sidebar/assistant-sidebar";
export {
  type OpenDetailAssistantMessage,
  type OpenDetailPersistenceOptions,
  type OpenDetailPersistenceStorage,
  type OpenDetailSubmitRequest,
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
  AssistantMessage,
  type AssistantMessageImage,
  type AssistantMessageMeta,
  type AssistantMessageProps,
  getSourcesCitedInContent,
} from "./ui/assistant-message/assistant-message";
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
  type AssistantStatusProps,
} from "./ui/assistant-status/assistant-status";
export {
  AssistantSuggestion,
  type AssistantSuggestionProps,
  AssistantSuggestions,
  type AssistantSuggestionsProps,
} from "./ui/assistant-suggestions/assistant-suggestions";
export {
  Composer,
  type ComposerProps,
  type ComposerRequest,
  type ComposerStatus,
} from "./ui/composer/composer";
export {
  ConversationLayout,
  type ConversationLayoutProps,
} from "./ui/conversation-layout/conversation-layout";
export { Thread, type ThreadProps } from "./ui/thread/thread";
export {
  UserMessage,
  type UserMessageProps,
} from "./ui/user-message/user-message";
