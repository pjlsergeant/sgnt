import OpenAI, { APIPromise } from 'openai';
import type { Logger } from '../logger.js';
import type { CompletionMiddleware, EmbeddingMiddleware } from './base.js';

/**
 * Middleware that wraps completion execution with a promise wrapper.
 *
 * @example
 * // Using p-limit for concurrency control
 * import pLimit from 'p-limit';
 * const limit = pLimit(5);
 * middleware: [wrapPromiseCompletion(limit)]
 *
 * @example
 * // Using p-throttle for rate limiting
 * import pThrottle from 'p-throttle';
 * const throttle = pThrottle({ limit: 10, interval: 1000 });
 * middleware: [wrapPromiseCompletion(throttle)]
 */
export function wrapPromiseCompletion<Args, ReturnValue = APIPromise<OpenAI.Chat.ChatCompletion>>(
  wrapper: <T>(fn: () => T) => T,
): CompletionMiddleware<Args, ReturnValue> {
  return (
    client: OpenAI,
    config: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
    args: Args,
    fn,
    logger: Logger,
  ) => {
    return wrapper(() => fn(client, config, args, logger));
  };
}

/**
 * Middleware that wraps embedding execution with a promise wrapper.
 *
 * @example
 * // Using p-limit for concurrency control
 * import pLimit from 'p-limit';
 * const limit = pLimit(5);
 * middleware: [wrapPromiseEmbedding(limit)]
 *
 * @example
 * // Using p-throttle for rate limiting
 * import pThrottle from 'p-throttle';
 * const throttle = pThrottle({ limit: 10, interval: 1000 });
 * middleware: [wrapPromiseEmbedding(throttle)]
 */
export function wrapPromiseEmbedding<
  Args,
  ReturnValue = APIPromise<OpenAI.Embeddings.CreateEmbeddingResponse>,
>(wrapper: <T>(fn: () => T) => T): EmbeddingMiddleware<Args, ReturnValue> {
  return (
    client: OpenAI,
    config: OpenAI.Embeddings.EmbeddingCreateParams,
    args: Args,
    fn,
    logger: Logger,
  ) => {
    return wrapper(() => fn(client, config, args, logger));
  };
}
