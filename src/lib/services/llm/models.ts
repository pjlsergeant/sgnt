export type LlmService = 'openai' | 'openRouter';

export const models = {
  //
  // OpenAI
  //
  // Standard models
  'gpt-4o-mini': {
    service: 'openai',
    input: 0.15 / 1000000,
    cached_input: 0.075 / 1000000,
    output: 0.6 / 1000000,
  },

  'gpt-5-mini': {
    service: 'openai',
    input: 0.25 / 1_000_000,
    output: 2 / 1_000_000,
    cached_input: 0.03 / 1_000_000,
  },

  'gpt-5-nano': {
    service: 'openai',
    input: 0.05 / 1_000_000,
    output: 0.4 / 1_000_000,
    cached_input: 0.005 / 1_000_000,
  },

  // Reasoning
  'o3-mini': {
    service: 'openai',
    input: 1.1 / 1000000,
    cached_input: 0.55 / 1000000,
    output: 4.4 / 1000000,
  },
  'o4-mini': {
    service: 'openai',
    input: 1.1 / 1000000,
    cached_input: 0.275 / 1000000,
    output: 4.4 / 1000000,
  },

  'gpt-4.1-nano': {
    service: 'openai',
    input: 0.1 / 1000000,
    cached_input: 0.025 / 1000000,
    output: 0.4 / 1000000,
  },

  // only charged for input
  'text-embedding-3-large': {
    service: 'openai',
    input: 0.13 / 1000000,
    cached_input: NaN,
    output: NaN,
  },

  //
  // Prices here are listed for Cerebras, but groq (running the same model) are
  // similar, and we fall back to groq if Cerebras is down (which is rare).
  // see: https://openrouter.ai/openai/gpt-oss-120b?sort=throughput
  //
  'gpt-oss-120b': {
    service: 'openRouter',
    input: 0.15 / 1000000,
    cached_input: 0.075 / 1000000, // this isn't real via openrouter
    output: 0.6 / 1000000,
    providers: ['cerebras', 'groq'],
  },
} as const;
export type ModelName = keyof typeof models;
export type ModelDefinition = (typeof models)[ModelName];

export const defaultCompletion = 'gpt-5-mini';
