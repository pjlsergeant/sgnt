# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2026-08-24

### Changed

- **BREAKING**: Migrated to the Langfuse JS SDK v5 (OpenTelemetry-based). Peer
  dependency `langfuse` (v3) is replaced by `@langfuse/tracing` and
  `@langfuse/openai` (^5.10.1); host applications must register
  `@langfuse/otel`'s `LangfuseSpanProcessor` (e.g. via `NodeSDK`) for anything
  to be exported.
- **BREAKING**: `logToLangfuse` / `logEmbeddingsToLangfuse` are now
  `logToLangfuseCompletion` / `logToLangfuseEmbedding` and take a
  `LangfuseTraceHandle` instead of a v3 `LangfuseTraceClient`.

### Added

- `startTrace()` / `LangfuseTraceHandle`: a root observation plus the trace's
  correlating attributes (sessionId, userId, tags, traceName), re-applied to
  every child observation as Langfuse's observations-first data model
  requires. Handles must be `end()`ed — un-ended observations are never
  exported (unlike v3 traces, which posted immediately).
- `observeOpenAIWithTrace()` to wrap an OpenAI client under a trace handle
  outside the middleware pipeline.
- `wrapPromiseCompletion` / `wrapPromiseEmbedding` middleware for injecting
  p-limit/p-throttle-style wrappers.

## [0.2.0] - 2025-11-10

### Added

- Added `Logger` interface and `noopLogger` for structured logging support
- Added optional `logger` parameter to `LlmClient` constructor (defaults to noopLogger)
- Replaced console.log/console.error calls with proper logger calls
- Added `maxAttempts` parameter to `LlmClient` constructor (defaults to 3)
- Added `maxAttempts` option to `CompletePromptOptions` and `GenerateEmbeddingOptions` for per-operation override
- Improved retry logging with attempt numbers and better log levels (debug → warn → error)

### Changed

- **BREAKING**: Middleware signatures now require `logger` parameter as final argument
  - `CompletionMiddleware` now expects `(client, config, args, fn, logger) => ...`
  - `EmbeddingMiddleware` now expects `(client, config, args, fn, logger) => ...`
  - `CompletionFn` now expects `(client, config, args, logger) => ...`
  - `EmbeddingFn` now expects `(client, config, args, logger) => ...`
- Increased default retry attempts from 2 to 3 total attempts (1 initial + 2 retries)

## [0.1.0] - 2025-11-02

### Added

- Added `generateEmbedding()` method with middleware support
- Added model type safety: completion vs embedding models
- Added `InferCompletionModelNames` and `InferEmbeddingModelNames` helper types

### Changed

- Model definitions now require a `type` field ('completion' or 'embedding')
- `completePrompt` only accepts completion model names
- `generateEmbedding` only accepts embedding model names
- Model `extras` field now accepts any properties (allows OpenRouter-specific config)

## [0.0.1] - 2025-10-09

Initial release
