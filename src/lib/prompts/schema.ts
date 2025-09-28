import OpenAI from 'openai';
import { Static, TSchema } from 'typebox';
import { Compile, Validator } from 'typebox/compile';
import { Prompt, RenderPromptFn } from '~/lib/prompts/base';

export class PromptSchema<
  Args extends unknown[],
  ClientResponse extends OpenAI.Chat.Completions.ChatCompletion,
  ParseInput extends Record<string, any>,
  ParseOutput,
  Schema extends TSchema,
  ToolDescription extends {
    response_format: {
      type: 'json_schema';
      json_schema: {
        name: 'prompt_output';
        schema: Static<Schema>;
      };
    };
  },
> implements Prompt<Args, ClientResponse, ParseInput, ParseOutput, ToolDescription>
{
  protected compiledParser: Validator<any, Schema>;

  constructor(
    public outputSchema: Schema,
    public renderPrompt: RenderPromptFn<Args>,
  ) {
    this.compiledParser = Compile(outputSchema);
  }

  extract(response: ClientResponse) {
    const message = response.choices[0]?.message;
    if (!message) throw new Error(`No choices returned`);
    if (message.refusal) throw new Error(`Refusal: ${message.refusal}`);

    const content = message.content;
    if (!content) throw new Error('Empty content');

    return JSON.parse(content) as ParseInput;
  }

  parse(input: ParseInput) {
    return this.compiledParser.Parse(input) as ParseOutput;
  }

  describeStructure = (() => {
    return {
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'prompt_output',
          schema: this.outputSchema,
        },
      },
    };
  }) as () => ToolDescription;
}
