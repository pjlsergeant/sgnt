import { LangfuseConfig, LangfuseTraceClient, observeOpenAI } from 'langfuse';
import OpenAI from 'openai';
import { CompletionFn, CompletionMiddleware } from './base.js';
import { OpenAiChatCompletionCreateParamsNonStreaming } from '../prompts/openai-types.js';

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
