export type OpenAiChatCompletionRole = 'system' | 'user' | 'assistant' | 'tool';

export interface OpenAiChatCompletionFunctionCall {
  name: string;
  arguments: string;
  [key: string]: unknown;
}

export interface OpenAiChatCompletionToolCall {
  id: string;
  type: 'function';
  function: OpenAiChatCompletionFunctionCall;
  [key: string]: unknown;
}

export interface OpenAiChatCompletionMessage {
  role: OpenAiChatCompletionRole;
  content?: string;
  refusal?: string;
  tool_calls?: OpenAiChatCompletionToolCall[];
  [key: string]: unknown;
}

export interface OpenAiChatCompletionChoice {
  index: number;
  message: OpenAiChatCompletionMessage;
  finish_reason?: string;
  [key: string]: unknown;
}

export interface OpenAiChatCompletionUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  [key: string]: unknown;
}

export interface OpenAiChatCompletion {
  id?: string;
  created?: number;
  model?: string;
  choices: OpenAiChatCompletionChoice[];
  usage?: OpenAiChatCompletionUsage;
  [key: string]: unknown;
}

export interface OpenAiChatCompletionMessageParam {
  role: OpenAiChatCompletionRole;
  content: string;
  name?: string;
  [key: string]: unknown;
}

export interface OpenAiChatCompletionToolDefinition {
  type: 'function';
  function: {
    name: string;
    description?: string;
    strict?: boolean;
    parameters: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export type OpenAiChatCompletionToolChoice =
  | 'none'
  | 'auto'
  | 'required'
  | {
      type: 'function';
      function: {
        name: string;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };

export interface OpenAiChatCompletionResponseFormat<Schema = unknown> {
  type: 'json_schema';
  json_schema: {
    name: string;
    schema: Schema;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface OpenAiChatCompletionCreateParamsNonStreaming<Schema = unknown> {
  model: string;
  messages: OpenAiChatCompletionMessageParam[];
  response_format?: OpenAiChatCompletionResponseFormat<Schema>;
  tools?: OpenAiChatCompletionToolDefinition[];
  tool_choice?: OpenAiChatCompletionToolChoice;
  [key: string]: unknown;
}
