import { ClientOptions } from 'openai';

// Base types for defining services and models
export type LlmService = {
  options: ClientOptions;
  lazyInitClient?: boolean;
};

export type LlmModel<ServiceNames extends string> = {
  service: ServiceNames;
  type: 'completion' | 'embedding';
  costs?: { input: number; cached_input: number; output: number };
  extras?: Record<string, any>;
};

// The shape of a complete LLM configuration
export type LlmConfig<
  Services extends Record<string, LlmService> = Record<string, LlmService>,
  Models extends Record<string, LlmModel<keyof Services & string>> = Record<
    string,
    LlmModel<keyof Services & string>
  >,
> = {
  services: Services;
  models: Models;
};

// Builder function that captures literal types and enforces relationships
export function defineLlmModelSet<
  const Services extends Record<string, LlmService>,
  const Models extends Record<string, LlmModel<keyof Services & string>>,
>(config: LlmConfig<Services, Models>) {
  return config;
}

// Type helpers to extract inferred types from a defined model set
export type InferServiceNames<T> = T extends { services: infer S } ? keyof S & string : never;

export type InferModelNames<T> = T extends { models: infer M } ? keyof M & string : never;

export type InferServices<T> = T extends { services: infer S } ? S : never;

export type InferModels<T> = T extends { models: infer M } ? M : never;

// Filter model names by type
export type InferCompletionModelNames<T> = T extends { models: infer M }
  ? {
      [K in keyof M]: M[K] extends { type: 'completion' } ? K : never;
    }[keyof M] &
      string
  : never;

export type InferEmbeddingModelNames<T> = T extends { models: infer M }
  ? {
      [K in keyof M]: M[K] extends { type: 'embedding' } ? K : never;
    }[keyof M] &
      string
  : never;

// Example usage:
export const llmConfig = defineLlmModelSet({
  services: {
    openai: {
      options: {
        apiKey: process.env.OPENAI_API_KEY,
      },
    },
    openRouter: {
      options: {
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
      },
    },
  },
  models: {
    // OpenAI - Standard models
    'gpt-4o-mini': {
      service: 'openai',
      type: 'completion',
      costs: {
        input: 0.15 / 1000000,
        cached_input: 0.075 / 1000000,
        output: 0.6 / 1000000,
      },
    },
    'gpt-5-mini': {
      service: 'openai',
      type: 'completion',
      costs: {
        input: 0.25 / 1_000_000,
        cached_input: 0.03 / 1_000_000,
        output: 2 / 1_000_000,
      },
    },
    'gpt-5-nano': {
      service: 'openai',
      type: 'completion',
      costs: {
        input: 0.05 / 1_000_000,
        cached_input: 0.005 / 1_000_000,
        output: 0.4 / 1_000_000,
      },
    },
    // Reasoning
    'o3-mini': {
      service: 'openai',
      type: 'completion',
      costs: {
        input: 1.1 / 1000000,
        cached_input: 0.55 / 1000000,
        output: 4.4 / 1000000,
      },
    },
    'o4-mini': {
      service: 'openai',
      type: 'completion',
      costs: {
        input: 1.1 / 1000000,
        cached_input: 0.275 / 1000000,
        output: 4.4 / 1000000,
      },
    },
    'gpt-4.1-nano': {
      service: 'openai',
      type: 'completion',
      costs: {
        input: 0.1 / 1000000,
        cached_input: 0.025 / 1000000,
        output: 0.4 / 1000000,
      },
    },
    // Embeddings - only charged for input
    'text-embedding-3-large': {
      service: 'openai',
      type: 'embedding',
      costs: {
        input: 0.13 / 1000000,
        cached_input: NaN,
        output: NaN,
      },
    },
    // OpenRouter models
    // Prices here are listed for Cerebras, but groq (running the same model) are
    // similar, and we fall back to groq if Cerebras is down (which is rare).
    // see: https://openrouter.ai/openai/gpt-oss-120b?sort=throughput
    'gpt-oss-120b': {
      service: 'openRouter',
      type: 'completion',
      costs: {
        input: 0.15 / 1000000,
        cached_input: 0.075 / 1000000, // this isn't real via openrouter
        output: 0.6 / 1000000,
      },
      extras: {
        providers: ['cerebras', 'groq'],
      },
    },
  },
});

// Extract types from the actual config
export type ServiceName = InferServiceNames<typeof llmConfig>;
export type ModelName = InferModelNames<typeof llmConfig>;
export type Services = InferServices<typeof llmConfig>;
export type Models = InferModels<typeof llmConfig>;

export const defaultCompletion: ModelName = 'gpt-5-mini';
