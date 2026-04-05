export const OPENDETAIL_CONFIG_FILE = "opendetail.toml";
export const OPENDETAIL_INDEX_DIRECTORY = ".opendetail";
export const OPENDETAIL_INDEX_FILE = ".opendetail/index.json";
export const OPENDETAIL_INSTRUCTIONS_FILE = "OPENDETAIL.md";
export const OPENDETAIL_PREFERRED_INSTRUCTIONS_FILE = `${OPENDETAIL_INDEX_DIRECTORY}/${OPENDETAIL_INSTRUCTIONS_FILE}`;
export const OPENDETAIL_VERSION = 1;
export const DEFAULT_BASE_PATH = "/";
export const DEFAULT_MODEL = "gpt-5.4-mini";
export const DEFAULT_REASONING_EFFORT = "none";
export const DEFAULT_VERBOSITY = "low";
export const DEFAULT_STORE = false;
export const DEFAULT_PROMPT_CACHE_RETENTION = "in-memory";
export const DEFAULT_FALLBACK_TEXT =
  "This isn't documented in the configured docs yet.";
export const DEFAULT_CHUNK_CHARACTER_LIMIT = 1200;
export const DEFAULT_MAX_RETRIEVED_CHUNKS = 6;
export const DEFAULT_MAX_RETURNED_IMAGES = 3;
export const MAX_QUESTION_LENGTH = 4000;
export const MAX_SITE_PATHS = 24;
export const MAX_SITE_PATH_LENGTH = 512;
export const MAX_CONVERSATION_TITLE_LENGTH = 80;
/** Substring used in title-generation instructions so tests can identify the request. */
export const OPENDETAIL_CONVERSATION_TITLE_INSTRUCTIONS_MARKER =
  "OpenDetail conversation title task";
export const CONVERSATION_TITLE_FALLBACK_WORD_COUNT = 5;
export const BUILD_FILE_READ_CONCURRENCY = 8;
export const NDJSON_CONTENT_TYPE = "application/x-ndjson; charset=utf-8";
