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

export { LlmClient } from './lib/services/llm/client.js';
export { models, defaultCompletion } from './lib/services/llm/models.js';
export type { LlmService, ModelName, ModelDefinition } from './lib/services/llm/models.js';

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

export { logToLangfuse } from './lib/middleware/langfuse.js';
