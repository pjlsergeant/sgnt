import OpenAI, { APIPromise } from 'openai';

export type CompletionFn<Args, ReturnValue = APIPromise<OpenAI.Chat.ChatCompletion>> = (
  client: OpenAI,
  config: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  args: Args,
) => ReturnValue;

export type CompletionMiddleware<Args, ReturnValue = APIPromise<OpenAI.Chat.ChatCompletion>> = (
  client: OpenAI,
  config: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  promptArgs: Args,
  fn: CompletionFn<Args, ReturnValue>,
) => ReturnValue;

export function middlewareReducer<Args, ReturnValue>(
  completionFn: CompletionFn<Args, ReturnValue>,
  middleware: CompletionMiddleware<Args, ReturnValue>,
): CompletionFn<Args, ReturnValue> {
  return (client: OpenAI, config: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming, args: Args) =>
    middleware(client, config, args, completionFn);
}

export type EmbeddingFn<
  Args,
  ReturnValue = APIPromise<OpenAI.Embeddings.CreateEmbeddingResponse>,
> = (client: OpenAI, config: OpenAI.Embeddings.EmbeddingCreateParams, args: Args) => ReturnValue;

export type EmbeddingMiddleware<
  Args,
  ReturnValue = APIPromise<OpenAI.Embeddings.CreateEmbeddingResponse>,
> = (
  client: OpenAI,
  config: OpenAI.Embeddings.EmbeddingCreateParams,
  embeddingArgs: Args,
  fn: EmbeddingFn<Args, ReturnValue>,
) => ReturnValue;

export function embeddingReducer<Args, ReturnValue>(
  embeddingFn: EmbeddingFn<Args, ReturnValue>,
  middleware: EmbeddingMiddleware<Args, ReturnValue>,
): EmbeddingFn<Args, ReturnValue> {
  return (client: OpenAI, config: OpenAI.Embeddings.EmbeddingCreateParams, args: Args) =>
    middleware(client, config, args, embeddingFn);
}
