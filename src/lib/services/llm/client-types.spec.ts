import { describe, it, expectTypeOf } from 'vitest';
import type { InferCompletionModelNames, InferEmbeddingModelNames } from './models.js';
import { defineLlmModelSet } from './models.js';
import type { CompletePromptOptions, GenerateEmbeddingOptions } from './client.js';

describe('LlmClient type safety', () => {
  // Set up a test config with both completion and embedding models
  const testConfig = defineLlmModelSet({
    services: {
      openai: {
        options: { apiKey: 'test' },
      },
    },
    models: {
      'gpt-4': {
        type: 'completion',
        service: 'openai',
      },
      'text-embedding-3-small': {
        type: 'embedding',
        service: 'openai',
      },
    },
  });

  type TestConfig = typeof testConfig;

  // Use testConfig to satisfy linter
  it('test config is defined', () => {
    expectTypeOf(testConfig).toMatchTypeOf<TestConfig>();
  });

  it('InferCompletionModelNames only includes completion models', () => {
    // This ensures the type is EXACTLY 'gpt-4', not string or both models
    expectTypeOf<InferCompletionModelNames<TestConfig>>().toEqualTypeOf<'gpt-4'>();

    // This ensures embedding models are NOT included
    expectTypeOf<InferCompletionModelNames<TestConfig>>().not.toEqualTypeOf<
      'gpt-4' | 'text-embedding-3-small'
    >();

    // This ensures it's not weakened to just 'string'
    expectTypeOf<InferCompletionModelNames<TestConfig>>().not.toEqualTypeOf<string>();
  });

  it('InferEmbeddingModelNames only includes embedding models', () => {
    // This ensures the type is EXACTLY 'text-embedding-3-small'
    expectTypeOf<InferEmbeddingModelNames<TestConfig>>().toEqualTypeOf<'text-embedding-3-small'>();

    // This ensures completion models are NOT included
    expectTypeOf<InferEmbeddingModelNames<TestConfig>>().not.toEqualTypeOf<
      'gpt-4' | 'text-embedding-3-small'
    >();

    // This ensures it's not weakened to just 'string'
    expectTypeOf<InferEmbeddingModelNames<TestConfig>>().not.toEqualTypeOf<string>();
  });

  it('CompletePromptOptions only accepts completion models', () => {
    // The user-facing API type for completePrompt options
    type Options = CompletePromptOptions<TestConfig, [string]>;

    // modelName should only accept 'gpt-4' or undefined (for default)
    expectTypeOf<Options['modelName']>().toEqualTypeOf<'gpt-4' | undefined>();

    // Should NOT accept embedding models
    expectTypeOf<Options['modelName']>().not.toEqualTypeOf<
      'gpt-4' | 'text-embedding-3-small' | undefined
    >();

    // Should NOT be weakened to string
    expectTypeOf<Options['modelName']>().not.toEqualTypeOf<string | undefined>();
  });

  it('GenerateEmbeddingOptions only accepts embedding models', () => {
    // The user-facing API type for generateEmbedding options
    type Options = GenerateEmbeddingOptions<TestConfig, [string]>;

    // modelName should only accept 'text-embedding-3-small' or undefined (for default)
    expectTypeOf<Options['modelName']>().toEqualTypeOf<'text-embedding-3-small' | undefined>();

    // Should NOT accept completion models
    expectTypeOf<Options['modelName']>().not.toEqualTypeOf<
      'gpt-4' | 'text-embedding-3-small' | undefined
    >();

    // Should NOT be weakened to string
    expectTypeOf<Options['modelName']>().not.toEqualTypeOf<string | undefined>();
  });
});
