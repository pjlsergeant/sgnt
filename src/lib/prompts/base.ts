import type OpenAI from 'openai';

export type RenderPromptFn<Args extends unknown[]> = (
  ...args: Args
) => string | OpenAI.Chat.ChatCompletionMessageParam[];

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
