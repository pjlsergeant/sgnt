import type OpenAI from 'openai';
import { describe, expect, it, vi } from 'vitest';
import { endOpenTraces, startTrace } from './langfuse.js';
import type { CompletionFn } from './middleware/base.js';
import { middlewareReducer } from './middleware/base.js';
import { logToLangfuseCompletion } from './middleware/langfuse.js';
import { noopLogger } from './logger.js';

// No OTEL provider is registered in tests, so spans are non-recording; these
// specs cover the handle/middleware mechanics, not export behavior.

describe('startTrace', () => {
  it('stores correlating attributes and defaults traceName to the span name', () => {
    const trace = startTrace('my-trace', { sessionId: 's-1', userId: 'u-1', tags: ['t'] });
    expect(trace.attributes).toEqual({
      traceName: 'my-trace',
      sessionId: 's-1',
      userId: 'u-1',
      tags: ['t'],
    });
    expect(trace.traceId).toBeTypeOf('string');
    trace.end();
  });

  it('endOpenTraces ends forgotten roots but not already-ended ones twice', () => {
    const forgotten = startTrace('forgotten');
    const closed = startTrace('closed');
    closed.end();
    const forgottenEnd = vi.spyOn(forgotten.root, 'end');
    const closedEnd = vi.spyOn(closed.root, 'end');
    endOpenTraces();
    endOpenTraces(); // idempotent
    expect(forgottenEnd).toHaveBeenCalledTimes(1);
    expect(closedEnd).not.toHaveBeenCalled();
  });

  it('end() is idempotent and sweeps un-ended child handles', () => {
    const trace = startTrace('sweep');
    const child = trace.span('left-open');
    const grandchild = child.span('also-open');
    const childEnd = vi.spyOn(child.root, 'end');
    const grandchildEnd = vi.spyOn(grandchild.root, 'end');
    trace.end();
    trace.end(); // second call is a no-op
    expect(childEnd).toHaveBeenCalledTimes(1);
    expect(grandchildEnd).toHaveBeenCalledTimes(1);
  });

  it('supports update, event, span children, and end without a registered provider', () => {
    const trace = startTrace('lifecycle', { input: { q: 'hi' } });
    trace.update({ metadata: { was_failure: true } });
    trace.event('error', { level: 'ERROR', statusMessage: 'boom' });
    const child = trace.span('step');
    child.end();
    trace.end({ output: 'done' });
  });
});

describe('logToLangfuseCompletion', () => {
  it('hands the completion fn a wrapped client and passes the result through', async () => {
    const trace = startTrace('mw', { sessionId: 's-2' });
    const dummyClient = { chat: { completions: {} } } as OpenAI;
    const dummyConfig: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model: 'gpt-4o-mini',
      messages: [],
    };

    let seenClient: OpenAI | undefined;
    const baseFn: CompletionFn<[], Promise<string>> = async (client) => {
      seenClient = client;
      return 'ok';
    };

    const composed = middlewareReducer(
      baseFn,
      logToLangfuseCompletion<[], Promise<string>>(trace, { generationName: 'gen' }),
    );
    const result = await composed(dummyClient, dummyConfig, [], noopLogger);

    expect(result).toBe('ok');
    // observeOpenAI returns a tracing proxy, not the original client
    expect(seenClient).toBeDefined();
    expect(seenClient).not.toBe(dummyClient);
    trace.end();
  });
});
