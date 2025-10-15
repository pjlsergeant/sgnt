import { describe, expect, it, vi } from 'vitest';
import type OpenAI from 'openai';
import type { OpenAiChatCompletionCreateParamsNonStreaming } from '~/lib/prompts/openai-types';
import { CompletionFn, CompletionMiddleware, middlewareReducer } from '~/lib/middleware/base';

describe('middlewareReducer', () => {
  it('nests middleware in registration order', async () => {
    const dummyClient = {} as OpenAI;
    const dummyConfig: OpenAiChatCompletionCreateParamsNonStreaming = {
      model: 'gpt-4o-mini',
      messages: [],
    };
    const dummyArgs: readonly [string] = ['prompt'];
    const events: string[] = [];

    const baseFn: CompletionFn<typeof dummyArgs, Promise<Record<string, unknown>>> = vi.fn(
      async () => {
        events.push('base');
        return {};
      },
    );

    const firstMiddleware: CompletionMiddleware<
      typeof dummyArgs,
      Promise<Record<string, unknown>>
    > = async (client, config, args, next) => {
      events.push('mw1-before');
      const result = await next(client, config, args);
      events.push('mw1-after');
      return result;
    };

    const secondMiddleware: CompletionMiddleware<
      typeof dummyArgs,
      Promise<Record<string, unknown>>
    > = async (client, config, args, next) => {
      events.push('mw2-before');
      const result = await next(client, config, args);
      events.push('mw2-after');
      return result;
    };

    let composed: CompletionFn<typeof dummyArgs, Promise<Record<string, unknown>>> = baseFn;
    composed = middlewareReducer(composed, firstMiddleware);
    composed = middlewareReducer(composed, secondMiddleware);

    await composed(dummyClient, dummyConfig, dummyArgs);

    expect(events).toEqual(['mw2-before', 'mw1-before', 'base', 'mw1-after', 'mw2-after']);
  });
});
