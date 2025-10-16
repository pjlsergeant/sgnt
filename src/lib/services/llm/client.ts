import OpenAI, { APIPromise } from 'openai';
import { defaultCompletion, ModelName, models } from './models.js';
import type { Prompt } from '../../prompts/base.js';
import { writeFileSync } from 'fs';
import cloneDeep from 'lodash-es/cloneDeep.js';
import { CompletionFn, CompletionMiddleware, middlewareReducer } from '../../middleware/base.js';

const createCompletion = <Args>(
  client: OpenAI,
  config: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  _args: Args,
) => client.chat.completions.create(config) as unknown as APIPromise<OpenAI.Chat.ChatCompletion>;

export type CompletePromptOptions<Args extends unknown[]> = {
  modelName?: ModelName;
  middleware?: CompletionMiddleware<Args>[];
};

export class LlmClient {
  defaultCompletion: ModelName = defaultCompletion;

  _openAiClient: OpenAI | null = null;
  _openRouterClient: OpenAI | null = null;

  constructor(
    openAiApiKey = process.env['OPENAI_API_KEY'],
    openRouterApiKey = process.env['OPENROUTER_API_KEY'],
  ) {
    if (openAiApiKey) this._openAiClient = new OpenAI({ apiKey: openAiApiKey });
    if (openRouterApiKey)
      this._openRouterClient = new OpenAI({
        apiKey: openRouterApiKey,
        baseURL: 'https://openrouter.ai/api/v1',
      });
  }

  _getClient(model: ModelName) {
    const service = models[model].service;
    const baseClient: OpenAI | null =
      service === 'openai' ? this._openAiClient : this._openRouterClient;
    if (!baseClient) throw new Error('Couldnt load model ' + model);

    // Add any observers here
    const client = baseClient;
    return client;
  }

  async completePrompt<Args extends unknown[], ParseOutput>(
    prompt: Prompt<Args, any, any, ParseOutput, any>,
    promptArgs: Args,
    options?: CompletePromptOptions<Args>,
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

    const config: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      messages: messagePayload,
      model,
      ...structureArgs,
      ...('providers' in models[model]
        ? {
            provider: {
              only: models[model].providers,
              sort: 'throughput',
            },
          }
        : {}),
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
