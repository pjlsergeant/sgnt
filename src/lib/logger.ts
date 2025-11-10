/**
 * Logger interface compatible with common logging libraries (pino, bunyan, etc).
 * Provides standard log levels from trace (most verbose) to fatal (least verbose).
 */
export interface Logger {
  fatal: (msg: string, ...args: unknown[]) => void;
  error: (msg: string, ...args: unknown[]) => void;
  warn: (msg: string, ...args: unknown[]) => void;
  info: (msg: string, ...args: unknown[]) => void;
  debug: (msg: string, ...args: unknown[]) => void;
  trace: (msg: string, ...args: unknown[]) => void;
}

/**
 * No-op logger implementation where all methods do nothing.
 * Useful as a default logger to avoid null checks.
 */
class NoopLogger implements Logger {
  fatal(_msg: string, ..._args: unknown[]): void {}
  error(_msg: string, ..._args: unknown[]): void {}
  warn(_msg: string, ..._args: unknown[]): void {}
  info(_msg: string, ..._args: unknown[]): void {}
  debug(_msg: string, ..._args: unknown[]): void {}
  trace(_msg: string, ..._args: unknown[]): void {}
}

/**
 * Default noop logger instance.
 * All logging methods are no-ops (do nothing).
 */
export const noopLogger: Logger = new NoopLogger();
