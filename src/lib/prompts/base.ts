import OpenAI from 'openai';

export type OpenAiMessages = (OpenAI.Chat.Completions.ChatCompletionMessageParam & {
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
