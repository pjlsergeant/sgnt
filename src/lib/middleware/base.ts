import OpenAI, { APIPromise } from 'openai';
import type { Logger } from '../logger.js';

export type CompletionFn<Args, ReturnValue = APIPromise<OpenAI.Chat.ChatCompletion>> = (
  client: OpenAI,
  config: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  args: Args,
  logger: Logger,
) => ReturnValue;

export type CompletionMiddleware<Args, ReturnValue = APIPromise<OpenAI.Chat.ChatCompletion>> = (
  client: OpenAI,
  config: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  promptArgs: Args,
  fn: CompletionFn<Args, ReturnValue>,
  logger: Logger,
) => ReturnValue;

export function middlewareReducer<Args, ReturnValue>(
  completionFn: CompletionFn<Args, ReturnValue>,
  middleware: CompletionMiddleware<Args, ReturnValue>,
): CompletionFn<Args, ReturnValue> {
  return (
    client: OpenAI,
    config: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
    args: Args,
    logger: Logger,
  ) => middleware(client, config, args, completionFn, logger);
}

export type EmbeddingFn<
  Args,
  ReturnValue = APIPromise<OpenAI.Embeddings.CreateEmbeddingResponse>,
> = (
  client: OpenAI,
  config: OpenAI.Embeddings.EmbeddingCreateParams,
  args: Args,
  logger: Logger,
) => ReturnValue;

export type EmbeddingMiddleware<
  Args,
  ReturnValue = APIPromise<OpenAI.Embeddings.CreateEmbeddingResponse>,
> = (
  client: OpenAI,
  config: OpenAI.Embeddings.EmbeddingCreateParams,
  embeddingArgs: Args,
  fn: EmbeddingFn<Args, ReturnValue>,
  logger: Logger,
) => ReturnValue;

export function embeddingReducer<Args, ReturnValue>(
  embeddingFn: EmbeddingFn<Args, ReturnValue>,
  middleware: EmbeddingMiddleware<Args, ReturnValue>,
): EmbeddingFn<Args, ReturnValue> {
  return (
    client: OpenAI,
    config: OpenAI.Embeddings.EmbeddingCreateParams,
    args: Args,
    logger: Logger,
  ) => middleware(client, config, args, embeddingFn, logger);
}
