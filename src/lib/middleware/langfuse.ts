import { observeOpenAI, type LangfuseConfig } from '@langfuse/openai';
import OpenAI, { APIPromise } from 'openai';
import type { LangfuseTraceHandle } from '../langfuse.js';
import type { Logger } from '../logger.js';
import type { CompletionMiddleware, EmbeddingMiddleware } from './base.js';

/**
 * Per-call configuration for the Langfuse middleware. Parenting and the
 * correlating attributes (sessionId, userId, tags, traceName) come from the
 * trace handle; everything else on the OpenAI integration config is
 * caller-settable.
 */
export type LogToLangfuseConfig = Omit<
  LangfuseConfig,
  'parentSpanContext' | 'sessionId' | 'userId' | 'tags' | 'traceName'
>;

/**
 * Wrap an OpenAI client so its calls become generations under the given
 * trace, carrying the trace's correlating attributes. Note: observeOpenAI's
 * config covers sessionId/userId/tags/traceName only — when the trace has a
 * `version`, invoke the call inside trace.propagate() (as the middleware
 * below does) so it reaches the generation too.
 */
export function observeOpenAIWithTrace(
  client: OpenAI,
  trace: LangfuseTraceHandle,
  config?: LogToLangfuseConfig,
): OpenAI {
  const { sessionId, userId, tags, traceName } = trace.attributes;
  return observeOpenAI(client, {
    sessionId,
    userId,
    tags,
    traceName,
    parentSpanContext: trace.root.otelSpan.spanContext(),
    ...config,
  });
}

export function logToLangfuseCompletion<Args, ReturnValue = APIPromise<OpenAI.Chat.ChatCompletion>>(
  trace: LangfuseTraceHandle,
  config?: LogToLangfuseConfig,
): CompletionMiddleware<Args, ReturnValue> {
  return (
    client: OpenAI,
    completionConfig: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
    args: Args,
    fn,
    logger: Logger,
  ) => {
    // propagate() supplies attributes observeOpenAI's config can't (version);
    // the wrapper's own propagation overrides the overlapping four fields
    return trace.propagate(() =>
      fn(observeOpenAIWithTrace(client, trace, config), completionConfig, args, logger),
    );
  };
}

export function logToLangfuseEmbedding<
  Args,
  ReturnValue = APIPromise<OpenAI.Embeddings.CreateEmbeddingResponse>,
>(
  trace: LangfuseTraceHandle,
  config?: LogToLangfuseConfig,
): EmbeddingMiddleware<Args, ReturnValue> {
  return (
    client: OpenAI,
    embeddingConfig: OpenAI.Embeddings.EmbeddingCreateParams,
    args: Args,
    fn,
    logger: Logger,
  ) => {
    return trace.propagate(() =>
      fn(observeOpenAIWithTrace(client, trace, config), embeddingConfig, args, logger),
    );
  };
}
