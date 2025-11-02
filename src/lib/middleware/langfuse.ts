import { LangfuseConfig, LangfuseTraceClient, observeOpenAI } from 'langfuse';
import OpenAI from 'openai';
import { CompletionFn, CompletionMiddleware, EmbeddingFn, EmbeddingMiddleware } from './base.js';

export function logToLangfuse<X>(
  trace: LangfuseTraceClient,
  traceConfig?: LangfuseConfig,
): CompletionMiddleware<X> {
  return (
    client: OpenAI,
    config: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
    promptArgs: X,
    fn: CompletionFn<X>,
  ) => {
    const wrappedClient = observeOpenAI(client, { parent: trace, ...traceConfig });
    return fn(wrappedClient, config, promptArgs);
  };
}

export function logEmbeddingsToLangfuse<X>(
  trace: LangfuseTraceClient,
  traceConfig?: LangfuseConfig,
): EmbeddingMiddleware<X> {
  return (
    client: OpenAI,
    config: OpenAI.Embeddings.EmbeddingCreateParams,
    embeddingArgs: X,
    fn: EmbeddingFn<X>,
  ) => {
    const wrappedClient = observeOpenAI(client, { parent: trace, ...traceConfig });
    return fn(wrappedClient, config, embeddingArgs);
  };
}
