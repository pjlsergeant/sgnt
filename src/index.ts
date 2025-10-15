export type { Prompt, PromptOutput, RenderPromptFn, OpenAiMessages } from '~/lib/prompts/base';
export type {
  OpenAiChatCompletion,
  OpenAiChatCompletionMessage,
  OpenAiChatCompletionMessageParam,
  OpenAiChatCompletionToolCall,
  OpenAiChatCompletionCreateParamsNonStreaming,
} from '~/lib/prompts/openai-types';
export { PromptSchema } from '~/lib/prompts/schema';
export { defineTool, defineTools, PromptTools, ToolCallError } from '~/lib/prompts/tools';
export type {
  ToolDefinition,
  ToolDefinitions,
  ToolResponses,
  ToolResponseByName,
  ToolCallWire,
} from '~/lib/prompts/tools';

export { LlmClient } from '~/lib/services/llm/client';
export { models, defaultCompletion } from '~/lib/services/llm/models';
export type { LlmService, ModelName, ModelDefinition } from '~/lib/services/llm/models';

export { MainLoop } from '~/lib/services/main-loop';

export { ConversationDbBase, dbMessageToOpenAi } from '~/lib/services/conversation-db/base';
export type {
  ConversationDb,
  ConversationId,
  DbMessage,
  MessageId,
  UserId,
} from '~/lib/services/conversation-db/base';
export { ConversationDbInMemory } from '~/lib/services/conversation-db/in-memory';

export { logToLangfuse } from '~/lib/middleware/langfuse';
