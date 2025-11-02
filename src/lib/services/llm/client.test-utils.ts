import type OpenAI from 'openai';
import { LlmClient } from './client.js';
import type { LlmConfig } from './models.js';
import type { Prompt } from '../../prompts/base.js';

// Minimal test config
export const testConfig = {
  services: {
    testService: {
      options: { apiKey: 'test-key' },
    },
  },
  models: {
    'test-model': {
      service: 'testService',
      costs: { input: 0, cached_input: 0, output: 0 },
    },
  },
} as const satisfies LlmConfig;

// Test subclass that lets us inject a mock client
export class TestLlmClient extends LlmClient<typeof testConfig> {
  mockClient: OpenAI | null = null;

  _getClient(_model: string): OpenAI {
    return this.mockClient!;
  }
}

// Minimal test prompt
export class TestPrompt implements Prompt<[string], any, any, string, any> {
  renderPrompt(input: string) {
    return [{ role: 'user' as const, content: input }];
  }
  describeStructure() {
    return {};
  }
  extract(response: any): string {
    return response.choices[0].message.content;
  }
  parse(extracted: string): string {
    return extracted;
  }
}
