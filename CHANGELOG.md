# Changelog

All notable changes to this project will be documented in this file.

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
