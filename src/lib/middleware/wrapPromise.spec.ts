import { describe, expect, it } from 'vitest';
import type OpenAI from 'openai';
import { wrapPromiseCompletion, wrapPromiseEmbedding } from './wrapPromise.js';
import { middlewareReducer, embeddingReducer } from './base.js';
import type { CompletionFn, EmbeddingFn } from './base.js';
import { noopLogger } from '../logger.js';

describe('wrapPromiseCompletion', () => {
  it('wraps a completion function', async () => {
    const dummyClient = {} as OpenAI;
    const dummyConfig: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model: 'gpt-4o-mini',
      messages: [],
    };
    const dummyArgs: readonly [string] = ['prompt'];

    let wrapperCalls = 0;
    const mockWrapper = <T>(fn: () => T): T => {
      wrapperCalls++;
      return fn();
    };

    const baseFn: CompletionFn<typeof dummyArgs, Promise<{ result: string }>> = async () => {
      return { result: 'test' };
    };

    const middleware = wrapPromiseCompletion<typeof dummyArgs, Promise<{ result: string }>>(
      mockWrapper,
    );
    const composed = middlewareReducer(baseFn, middleware);

    const result = await composed(dummyClient, dummyConfig, dummyArgs, noopLogger);

    expect(wrapperCalls).toBe(1);
    expect(result).toEqual({ result: 'test' });
  });
});

describe('wrapPromiseEmbedding', () => {
  it('wraps an embedding function', async () => {
    const dummyClient = {} as OpenAI;
    const dummyConfig: OpenAI.Embeddings.EmbeddingCreateParams = {
      model: 'text-embedding-3-small',
      input: 'test',
    };
    const dummyArgs: readonly [string] = ['test'];

    let wrapperCalls = 0;
    const mockWrapper = <T>(fn: () => T): T => {
      wrapperCalls++;
      return fn();
    };

    const baseFn: EmbeddingFn<typeof dummyArgs, Promise<{ embedding: number[] }>> = async () => {
      return { embedding: [0.1, 0.2, 0.3] };
    };

    const middleware = wrapPromiseEmbedding<typeof dummyArgs, Promise<{ embedding: number[] }>>(
      mockWrapper,
    );
    const composed = embeddingReducer(baseFn, middleware);

    const result = await composed(dummyClient, dummyConfig, dummyArgs, noopLogger);

    expect(wrapperCalls).toBe(1);
    expect(result).toEqual({ embedding: [0.1, 0.2, 0.3] });
  });
});
