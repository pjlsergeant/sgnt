import { LangfuseConfig, LangfuseTraceClient, observeOpenAI } from 'langfuse';
import OpenAI from 'openai';
import { CompletionFn, CompletionMiddleware } from '~/lib/middleware/base';
import { OpenAiChatCompletionCreateParamsNonStreaming } from '~/lib/prompts/openai-types';

export function logToLangfuse<X>(
  trace: LangfuseTraceClient,
  traceConfig?: LangfuseConfig,
): CompletionMiddleware<X> {
  return (
    client: OpenAI,
    config: OpenAiChatCompletionCreateParamsNonStreaming,
    promptArgs: X,
    fn: CompletionFn<X>,
  ) => {
    const wrappedClient = observeOpenAI(client, { parent: trace, ...traceConfig });
    return fn(wrappedClient, config, promptArgs);
  };
}
