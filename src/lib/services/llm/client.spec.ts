import { describe, expect, it, vi } from 'vitest';
import { TestLlmClient, TestPrompt, testConfig } from './client.test-utils.js';
import type { EmbeddingFn, EmbeddingMiddleware } from '../../middleware/base.js';
import { embeddingReducer } from '../../middleware/base.js';
import type OpenAI from 'openai';

describe('LlmClient', () => {
  it('completes a prompt successfully', async () => {
    const client = new TestLlmClient(testConfig, 'test-model');

    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: 'Hello!' } }],
    });

    client.mockClient = {
      chat: { completions: { create: mockCreate } },
    } as any;

    const prompt = new TestPrompt();
    const [result] = await client.completePrompt(prompt, ['Hi']);

    expect(result).toBe('Hello!');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    const client = new TestLlmClient(testConfig, 'test-model');

    const mockCreate = vi
      .fn()
      .mockRejectedValueOnce(new Error('API error'))
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'Success!' } }],
      });

    client.mockClient = {
      chat: { completions: { create: mockCreate } },
    } as any;

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const prompt = new TestPrompt();
    const [result] = await client.completePrompt(prompt, ['Hi']);

    expect(result).toBe('Success!');
    expect(mockCreate).toHaveBeenCalledTimes(2);

    consoleLogSpy.mockRestore();
  });

  it('throws error after all retries fail', async () => {
    const client = new TestLlmClient(testConfig, 'test-model');

    const mockCreate = vi.fn().mockRejectedValue(new Error('Persistent API error'));

    client.mockClient = {
      chat: { completions: { create: mockCreate } },
    } as any;

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const prompt = new TestPrompt();

    await expect(client.completePrompt(prompt, ['Hi'])).rejects.toThrow('Persistent API error');

    expect(mockCreate).toHaveBeenCalledTimes(2);

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('generates an embedding successfully', async () => {
    const client = new TestLlmClient(testConfig, 'test-model');

    const mockCreate = vi.fn().mockResolvedValue({
      data: [{ embedding: [0.1, 0.2, 0.3] }],
    });

    client.mockClient = {
      embeddings: { create: mockCreate },
    } as any;

    const [embedding] = await client.generateEmbedding('Test text');

    expect(embedding).toEqual([0.1, 0.2, 0.3]);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'test-model',
      input: 'Test text',
    });
  });

  it('applies middleware to embeddings', async () => {
    const dummyClient = {} as OpenAI;
    const dummyConfig: OpenAI.Embeddings.EmbeddingCreateParams = {
      model: 'test-model',
      input: 'test',
    };
    const dummyArgs: readonly [string] = ['test'];
    const events: string[] = [];

    const baseFn: EmbeddingFn<typeof dummyArgs, Promise<Record<string, unknown>>> = vi.fn(
      async () => {
        events.push('base');
        return {};
      },
    );

    const middleware1: EmbeddingMiddleware<
      typeof dummyArgs,
      Promise<Record<string, unknown>>
    > = async (client, config, args, next) => {
      events.push('mw1-before');
      const result = await next(client, config, args);
      events.push('mw1-after');
      return result;
    };

    const middleware2: EmbeddingMiddleware<
      typeof dummyArgs,
      Promise<Record<string, unknown>>
    > = async (client, config, args, next) => {
      events.push('mw2-before');
      const result = await next(client, config, args);
      events.push('mw2-after');
      return result;
    };

    let composed: EmbeddingFn<typeof dummyArgs, Promise<Record<string, unknown>>> = baseFn;
    composed = embeddingReducer(composed, middleware1);
    composed = embeddingReducer(composed, middleware2);

    await composed(dummyClient, dummyConfig, dummyArgs);

    expect(events).toEqual(['mw2-before', 'mw1-before', 'base', 'mw1-after', 'mw2-after']);
  });
});
