import { Static, TSchema } from 'typebox';
import { Compile, Validator } from 'typebox/compile';
import type OpenAI from 'openai';
import { Prompt, RenderPromptFn } from './base.js';

type PromptSchemaStructure<Schema extends TSchema> = {
  response_format: {
    type: 'json_schema';
    json_schema: {
      name: 'prompt_output';
      schema: Schema;
    };
  };
};

export class PromptSchema<
  Args extends unknown[],
  Schema extends TSchema,
  ParseInput = Static<Schema>,
  ParseOutput = Static<Schema>,
  SchemaDescription extends PromptSchemaStructure<Schema> = PromptSchemaStructure<Schema>,
  ClientResponse extends OpenAI.Chat.ChatCompletion = OpenAI.Chat.ChatCompletion,
> implements Prompt<Args, ClientResponse, ParseInput, ParseOutput, SchemaDescription>
{
  protected compiledParser: Validator<any, Schema>;

  constructor(
    public outputSchema: Schema,
    public renderPrompt: RenderPromptFn<Args>,
  ) {
    this.compiledParser = Compile(outputSchema);
  }

  // Preview the prompt
  debugRender(args: Args) {
    const rendered = this.renderPrompt(...args);
    if (typeof rendered === 'string') return rendered;
    return JSON.stringify(rendered);
  }

  extract(response: ClientResponse): ParseInput {
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
  }) as () => SchemaDescription;
}
