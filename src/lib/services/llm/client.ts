import OpenAI, { APIPromise } from 'openai';
import type { LlmConfig, InferModelNames, InferServiceNames } from './models.js';
import { llmConfig, defaultCompletion } from './models.js';
import type { Prompt } from '../../prompts/base.js';
import { writeFileSync } from 'fs';
import cloneDeep from 'lodash-es/cloneDeep.js';
import { CompletionFn, CompletionMiddleware, middlewareReducer } from '../../middleware/base.js';

const createCompletion = <Args>(
  client: OpenAI,
  config: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  _args: Args,
) => client.chat.completions.create(config) as unknown as APIPromise<OpenAI.Chat.ChatCompletion>;

export type CompletePromptOptions<Config extends LlmConfig, Args extends unknown[]> = {
  modelName?: InferModelNames<Config>;
  middleware?: CompletionMiddleware<Args>[];
};

export class LlmClient<Config extends LlmConfig> {
  defaultCompletion: InferModelNames<Config>;
  private _clients: Map<InferServiceNames<Config>, OpenAI> = new Map();

  constructor(
    private config: Config,
    defaultCompletion?: InferModelNames<Config>,
  ) {
    this.defaultCompletion =
      defaultCompletion ?? (Object.keys(config.models)[0] as InferModelNames<Config>);
  }

  private _getClient(model: InferModelNames<Config>): OpenAI {
    const modelDef = this.config.models[model];
    if (!modelDef) {
      throw new Error(`Model '${String(model)}' not found in config`);
    }

    const serviceName = modelDef.service as InferServiceNames<Config>;

    // Check if client already exists
    if (this._clients.has(serviceName)) {
      return this._clients.get(serviceName)!;
    }

    // Initialize client lazily
    const serviceDef = this.config.services[serviceName];
    if (!serviceDef) {
      throw new Error(`Service '${String(serviceName)}' not found in config`);
    }

    const client = new OpenAI(serviceDef.options);

    // Cache unless lazyInitClient is explicitly false
    if (serviceDef.lazyInitClient !== false) {
      this._clients.set(serviceName, client);
    }

    return client;
  }

  async completePrompt<Args extends unknown[], ParseOutput>(
    prompt: Prompt<Args, any, any, ParseOutput, any>,
    promptArgs: Args,
    options?: CompletePromptOptions<Config, Args>,
  ): Promise<[ParseOutput, string]> {
    const model = options?.modelName ?? this.defaultCompletion;
    const middleware = options?.middleware ?? [];
    const client = this._getClient(model);

    const promptRendered = prompt.renderPrompt(...promptArgs);
    const messagePayload = Array.isArray(promptRendered)
      ? promptRendered
      : [{ role: 'system' as const, content: promptRendered }];
    const lastContent = messagePayload.at(-1)?.content;
    const promptSample =
      typeof lastContent === 'string' ? lastContent.substring(0, 255) : '[empty prompt?]';

    const structureArgs = prompt.describeStructure();

    writeFileSync('/tmp/messages.json', JSON.stringify(messagePayload, undefined, 2));

    const modelDef = this.config.models[model];
    if (!modelDef) {
      throw new Error(`Model '${String(model)}' not found in config`);
    }

    const config: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      messages: messagePayload,
      model: model as string,
      ...structureArgs,
      ...(modelDef.extras ?? {}),
    };

    let fn: CompletionFn<Args> = createCompletion;

    for (const middlewareFn of middleware) {
      fn = middlewareReducer(fn, middlewareFn);
    }

    const attempts = [
      ['initial attempt', 'debug', false],
      ['retry', 'warn', true],
    ] as const;

    for (const attempt of attempts) {
      const [label, logLevel, fatal] = attempt;

      try {
        const wholeClientResponse = await fn(client, cloneDeep(config), cloneDeep(promptArgs));
        const relevantClientResponse = prompt.extract(wholeClientResponse);
        const payload = prompt.parse(relevantClientResponse);

        // console.dir({ payload }, { depth: null });
        return [payload, JSON.stringify(relevantClientResponse, undefined, 2)];
      } catch (error) {
        console[logLevel === 'debug' ? 'log' : 'error'](`Error during generation ${label}`, {
          error,
          model,
          promptSample,
        });

        if (fatal) throw error;
      }
    }

    throw new Error("Final attempt is fatal so can't get here");
  }
}

// Default instance using the standard config
export const defaultLlmClient = new LlmClient(llmConfig, defaultCompletion);
