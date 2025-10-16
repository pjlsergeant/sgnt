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
