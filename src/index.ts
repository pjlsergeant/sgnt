export type { Prompt, PromptOutput, RenderPromptFn } from './lib/prompts/base.js';
export { PromptSchema } from './lib/prompts/schema.js';
export { defineTool, defineTools, PromptTools, ToolCallError } from './lib/prompts/tools.js';
export type {
  ToolDefinition,
  ToolDefinitions,
  ToolResponses,
  ToolResponseByName,
  ToolCallWire,
} from './lib/prompts/tools.js';

export { noopLogger } from './lib/logger.js';
export type { Logger } from './lib/logger.js';

export { LlmClient, defaultLlmClient } from './lib/services/llm/client.js';
export type { CompletePromptOptions, GenerateEmbeddingOptions } from './lib/services/llm/client.js';
export { llmConfig, defaultCompletion, defineLlmModelSet } from './lib/services/llm/models.js';
export type {
  LlmConfig,
  LlmService,
  LlmModel,
  InferServiceNames,
  InferModelNames,
  InferCompletionModelNames,
  InferEmbeddingModelNames,
  InferServices,
  InferModels,
  ServiceName,
  ModelName,
  Services,
  Models,
} from './lib/services/llm/models.js';

export { MainLoop } from './lib/services/main-loop.js';

export { ConversationDbBase, dbMessageToOpenAi } from './lib/services/conversation-db/base.js';
export type {
  ConversationDb,
  ConversationId,
  DbMessage,
  MessageId,
  UserId,
} from './lib/services/conversation-db/base.js';
export { ConversationDbInMemory } from './lib/services/conversation-db/in-memory.js';

export type {
  CompletionFn,
  CompletionMiddleware,
  EmbeddingFn,
  EmbeddingMiddleware,
} from './lib/middleware/base.js';
export { middlewareReducer, embeddingReducer } from './lib/middleware/base.js';

export {
  logToLangfuseCompletion,
  logToLangfuseEmbedding,
  observeOpenAIWithTrace,
} from './lib/middleware/langfuse.js';
export type { LogToLangfuseConfig } from './lib/middleware/langfuse.js';
export { wrapPromiseCompletion, wrapPromiseEmbedding } from './lib/middleware/wrapPromise.js';

export { endOpenTraces, LangfuseTraceHandle, startTrace } from './lib/langfuse.js';
export type { StartTraceOptions, TraceAttributes } from './lib/langfuse.js';
