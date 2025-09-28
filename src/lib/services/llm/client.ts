import OpenAI from 'openai';
import pThrottle from 'p-throttle';

import { defaultCompletion, ModelName, models } from './models';
import type { Prompt } from '~/lib/prompts/base';

export class LlmClient {
  throttle: ReturnType<typeof pThrottle> | null = null;
  defaultCompletion: ModelName = defaultCompletion;

  _openAiClient: OpenAI;
  _openRouterClient: OpenAI;

  constructor(
    openAiApiKey = process.env['OPENAI_API_KEY'],
    openRouterApiKey = process.env['OPENROUTER_API_KEY'],
  ) {
    this._openAiClient = new OpenAI({ apiKey: openAiApiKey });
    this._openRouterClient = new OpenAI({
      apiKey: openRouterApiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }

  _getClient(model: ModelName) {
    const service = models[model].service;
    const baseClient: OpenAI = service === 'openai' ? this._openAiClient : this._openRouterClient;

    // Add any observers here

    const client = baseClient;
    return client;
  }

  async completePrompt<Args extends unknown[], ParseOutput>(
    prompt: Prompt<Args, any, any, ParseOutput, any>,
    model: ModelName = this.defaultCompletion,
    ...promptArgs: Args
  ): Promise<ParseOutput> {
    const client = this._getClient(model);

    const promptRendered = prompt.renderPrompt(...promptArgs);
    const messagePayload = Array.isArray(promptRendered)
      ? promptRendered
      : [{ role: 'system', content: promptRendered }];
    const promptSample = messagePayload.at(-1)?.content?.substring(0, 255) ?? '[empty prompt?]';

    const structureArgs = prompt.describeStructure();

    const fn = () => {
      const config = {
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
      } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;

      console.dir(config, { depth: null });

      return client.chat.completions.create(config);
    };

    const throttled = this.throttle ? this.throttle(fn) : () => Promise.resolve(fn());

    const attempts = [
      ['initial attempt', 'debug', false],
      ['retry', 'warn', true],
    ] as const;

    for (const attempt of attempts) {
      const [label, logLevel, fatal] = attempt;

      try {
        const wholeClientResponse = await throttled();
        const relevantClientResponse = prompt.extract(wholeClientResponse);
        const payload = prompt.parse(relevantClientResponse);

        return payload;
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
