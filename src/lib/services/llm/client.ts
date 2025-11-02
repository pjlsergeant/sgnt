import OpenAI, { APIPromise } from 'openai';
import type { LlmConfig, InferModelNames, InferServiceNames } from './models.js';
import { llmConfig, defaultCompletion } from './models.js';
import type { Prompt } from '../../prompts/base.js';
import { writeFileSync } from 'fs';
import cloneDeep from 'lodash-es/cloneDeep.js';
import {
  CompletionFn,
  CompletionMiddleware,
  middlewareReducer,
  EmbeddingFn,
  EmbeddingMiddleware,
  embeddingReducer,
} from '../../middleware/base.js';

const createCompletion = <Args>(
  client: OpenAI,
  config: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  _args: Args,
) => client.chat.completions.create(config) as unknown as APIPromise<OpenAI.Chat.ChatCompletion>;

const createEmbedding = <Args>(
  client: OpenAI,
  config: OpenAI.Embeddings.EmbeddingCreateParams,
  _args: Args,
) =>
  client.embeddings.create(
    config,
  ) as unknown as APIPromise<OpenAI.Embeddings.CreateEmbeddingResponse>;

export type CompletePromptOptions<Config extends LlmConfig, Args extends unknown[]> = {
  modelName?: InferModelNames<Config>;
  middleware?: CompletionMiddleware<Args>[];
};

export type GenerateEmbeddingOptions<Config extends LlmConfig, Args> = {
  modelName?: InferModelNames<Config>;
  middleware?: EmbeddingMiddleware<Args>[];
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

  protected _getClient(model: InferModelNames<Config>): OpenAI {
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

  private async _withRetry<T>(
    operation: () => Promise<T>,
    context: { model: string; operationSample: string },
  ): Promise<T> {
    const attempts = [
      ['initial attempt', 'debug', false],
      ['retry', 'warn', true],
    ] as const;

    for (const attempt of attempts) {
      const [label, logLevel, fatal] = attempt;

      try {
        return await operation();
      } catch (error) {
        console[logLevel === 'debug' ? 'log' : 'error'](`Error during generation ${label}`, {
          error,
          model: context.model,
          operationSample: context.operationSample,
        });

        if (fatal) throw error;
      }
    }

    throw new Error("Final attempt is fatal so can't get here");
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

    return await this._withRetry(
      async () => {
        const wholeClientResponse = await fn(client, cloneDeep(config), cloneDeep(promptArgs));
        const relevantClientResponse = prompt.extract(wholeClientResponse);
        const payload = prompt.parse(relevantClientResponse);

        // console.dir({ payload }, { depth: null });
        return [payload, JSON.stringify(relevantClientResponse, undefined, 2)] as [
          ParseOutput,
          string,
        ];
      },
      {
        model: model as string,
        operationSample: promptSample,
      },
    );
  }

  async generateEmbedding(
    input: string,
    options?: GenerateEmbeddingOptions<Config, [string]>,
  ): Promise<[number[]]> {
    const model = options?.modelName ?? this.defaultCompletion;
    const middleware = options?.middleware ?? [];
    const client = this._getClient(model);

    const inputSample = input.substring(0, 255);

    const modelDef = this.config.models[model];
    if (!modelDef) {
      throw new Error(`Model '${String(model)}' not found in config`);
    }

    const config: OpenAI.Embeddings.EmbeddingCreateParams = {
      model: model as string,
      input,
      ...(modelDef.extras ?? {}),
    };

    let fn: EmbeddingFn<[string]> = createEmbedding;

    for (const middlewareFn of middleware) {
      fn = embeddingReducer(fn, middlewareFn);
    }

    return await this._withRetry(
      async () => {
        const response = await fn(client, cloneDeep(config), [input]);
        const embeddingData = response.data[0];
        if (!embeddingData) {
          throw new Error('No embedding data returned from API');
        }
        return [embeddingData.embedding];
      },
      {
        model: model as string,
        operationSample: inputSample,
      },
    );
  }
}

// Default instance using the standard config
export const defaultLlmClient = new LlmClient(llmConfig, defaultCompletion);
