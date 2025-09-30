import Type, { Static } from 'typebox';
import { Compile, Validator } from 'typebox/compile';
import { TLocalizedValidationError } from 'typebox/error';
import type {
  OpenAiChatCompletion,
  OpenAiChatCompletionCreateParamsNonStreaming,
} from '~/lib/prompts/openai-types';
import { Prompt, RenderPromptFn } from '~/lib/prompts/base';

//
// A single tool *definition*, eg what we use when we're creating it
//

type TAnyObject = ReturnType<typeof Type.Object>;
export type ToolDefinition<Name, ParamSchema extends TAnyObject> = {
  name: Name;
  description: string;
  parameters: ParamSchema;
};
export const defineTool = <const N extends string, P extends TAnyObject>(t: ToolDefinition<N, P>) =>
  t;

//
// A single tool *response*, eg what we're expecting back from a passed-in tool
// definition
//

type ToolResponse<T> =
  T extends ToolDefinition<infer N, infer P>
    ? { id: string; name: N; parameters: Static<P> }
    : never;

//
// A read-only array of tool definitions
//

export type ToolDefinitions = readonly ToolDefinition<string, TAnyObject>[];

//
// Response types of _multiple_ tools
//

// Helper
type _ToolResponseUnion<TTools extends ToolDefinitions> = ToolResponse<TTools[number]>;

// An array containing a response from one of the tools
export type ToolResponses<TTools extends ToolDefinitions> = _ToolResponseUnion<TTools>[];

// A dict allowing lookup of tool-type by its string name
export type ToolResponseByName<TTools extends ToolDefinitions> = {
  [K in TTools[number]['name']]: Extract<_ToolResponseUnion<TTools>, { name: K }>;
};

const toolCallWire = Type.Object({
  id: Type.String(),
  type: Type.Literal('function'),
  function: Type.Object({
    name: Type.String(),
    arguments: Type.String(),
  }),
});

const toolCallWiresC = Compile(Type.Array(toolCallWire));

export type ToolCallWire = Static<typeof toolCallWire>;

type PromptToolsStructure<Tools extends ToolDefinitions> = {
  tool_choice?: OpenAiChatCompletionCreateParamsNonStreaming['tool_choice'];
  tools: {
    type: 'function';
    function: {
      name: Tools[number]['name'];
      description: string;
      strict: true;
      parameters: any;
    };
  }[];
};

export class ToolCallError extends Error {
  constructor(
    message: string,
    public raw: unknown,
    public errors?: TLocalizedValidationError[],
  ) {
    super(message);
  }
}

export const defineTools = <const T extends ToolDefinitions>(ts: T) => {
  // Compile each individual call
  const parsers: Record<string, Validator> = {};
  for (const c of ts) {
    parsers[c.name] = Compile(c.parameters);
  }

  const parserFn = (calls: ToolCallWire[]) => {
    if (!toolCallWiresC.Check(calls)) {
      throw new ToolCallError('Failed envelope validation', calls, toolCallWiresC.Errors(calls));
    }

    const checked = calls.map((c) => {
      const name = c.function.name;

      const parser = parsers[name];
      if (!parser) {
        throw new ToolCallError(`Unknown function ${name}`, c);
      }

      let hydratedArguments: unknown;
      try {
        hydratedArguments = JSON.parse(c.function.arguments);
      } catch (e) {
        throw new ToolCallError(`Couldn't parse 'arguments' as JSON: ${(e as Error).message}`, c);
      }

      if (!parser.Check(hydratedArguments)) {
        throw new ToolCallError(
          `Failed 'arguments' validation`,
          c,
          parser.Errors(hydratedArguments),
        );
      }

      return { name: c.function.name, id: c.id, parameters: hydratedArguments };
    });

    return checked as ToolResponses<T>;
  };

  return [ts, parserFn] as const;
};

export class PromptTools<
  Args extends unknown[],
  ParseInput extends ToolCallWire[],
  ParseOutput extends ToolResponses<Tools>,
  Tools extends ToolDefinitions,
  ToolDescription extends PromptToolsStructure<Tools>,
  ClientResponse extends OpenAiChatCompletion = OpenAiChatCompletion,
> implements
    Prompt<Args, ClientResponse, ParseInput | string, ParseOutput | string, ToolDescription>
{
  // protected compiledParser: Validator<any, Schema>;

  constructor(
    public tools: Tools,
    public parser: (input: ParseInput) => ParseOutput,
    public renderPrompt: RenderPromptFn<Args>,
    public toolChoice?: OpenAiChatCompletionCreateParamsNonStreaming['tool_choice'],
  ) {
    // this.compiledParser = Compile(outputSchema);
  }

  extract(response: ClientResponse) {
    const message = response.choices[0]?.message;
    if (!message) throw new Error(`No choices returned`);
    if (message.refusal) throw new Error(`Refusal: ${message.refusal}`);

    const toolCalls = message.tool_calls;
    if (!toolCalls) {
      const content = message.content;
      if (!content) throw new Error(`Empty content`);
      return content;
    }

    return toolCalls as ParseInput;
  }

  parse(input: ParseInput | string) {
    if (typeof input === 'string') return input as string;
    return this.parser(input);
  }

  describeStructure = (() => {
    return {
      ...(this.toolChoice ? { tool_choice: this.toolChoice } : {}),
      tools: this.tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          strict: true,
          // additionalProperties: false required by OpenAI
          parameters: { ...t.parameters, additionalProperties: false },
        },
      })),
    };
  }) as () => ToolDescription;
}
