import OpenAI from 'openai';

export type OpenAiChatCompletion = OpenAI.Chat.Completions.ChatCompletion;
export type OpenAiChatCompletionMessageParam = OpenAI.Chat.Completions.ChatCompletionMessageParam;
export type OpenAiChatCompletionCreateParamsNonStreaming =
  OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;

export type OpenAiMessages = (OpenAiChatCompletionMessageParam & {
  content: string;
})[];
export type RenderPromptFn<Args extends unknown[]> = (...args: Args) => string | OpenAiMessages;

export interface Prompt<
  Args extends unknown[],
  ClientResponse,
  ParseInput,
  ParseOutput,
  ClientToolDescription,
> {
  renderPrompt: RenderPromptFn<Args>;
  describeStructure: () => ClientToolDescription;
  extract: (response: ClientResponse) => ParseInput;
  parse: (input: ParseInput) => ParseOutput;
}

export type PromptOutput<P extends Prompt<any, any, any, any, any>> =
  P extends Prompt<any, any, any, infer R, any> ? R : never;
