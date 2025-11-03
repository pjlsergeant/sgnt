# Changelog

All notable changes to this project will be documented in this file.

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
