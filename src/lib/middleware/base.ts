import OpenAI, { APIPromise } from 'openai';
import {
  OpenAiChatCompletion,
  OpenAiChatCompletionCreateParamsNonStreaming,
} from '../prompts/openai-types.js';

export type CompletionFn<Args, ReturnValue = APIPromise<OpenAiChatCompletion>> = (
  client: OpenAI,
  config: OpenAiChatCompletionCreateParamsNonStreaming,
  args: Args,
) => ReturnValue;

export type CompletionMiddleware<Args, ReturnValue = APIPromise<OpenAiChatCompletion>> = (
  client: OpenAI,
  config: OpenAiChatCompletionCreateParamsNonStreaming,
  promptArgs: Args,
  fn: CompletionFn<Args, ReturnValue>,
) => ReturnValue;

export function middlewareReducer<Args, ReturnValue>(
  completionFn: CompletionFn<Args, ReturnValue>,
  middleware: CompletionMiddleware<Args, ReturnValue>,
): CompletionFn<Args, ReturnValue> {
  return (client: OpenAI, config: OpenAiChatCompletionCreateParamsNonStreaming, args: Args) =>
    middleware(client, config, args, completionFn);
}
