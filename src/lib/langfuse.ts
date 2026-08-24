import {
  LangfuseOtelSpanAttributes,
  propagateAttributes,
  startObservation,
  type LangfuseEventAttributes,
  type LangfuseSpan,
  type LangfuseSpanAttributes,
} from '@langfuse/tracing';

/**
 * Correlating attributes shared by every observation in a trace.
 *
 * Langfuse's observations-first data model requires these on each observation
 * (not just the trace), so the handle stores them and re-applies them whenever
 * a child observation is created — including the generations produced by the
 * logToLangfuse* middleware.
 */
export type TraceAttributes = {
  traceName?: string;
  sessionId?: string;
  userId?: string;
  tags?: string[];
  version?: string;
};

export type StartTraceOptions = TraceAttributes & {
  /** Trace input, recorded on the root observation. */
  input?: unknown;
  /** Root-observation metadata; values may be any JSON. */
  metadata?: Record<string, unknown>;
};

/**
 * A root observation plus the correlating attributes for its trace.
 *
 * Create one with startTrace() and pass it around wherever the v3 SDK's
 * TraceClient used to go. Unlike v3 traces, the root observation only reaches
 * Langfuse once end() is called.
 */
export class LangfuseTraceHandle {
  readonly root: LangfuseSpan;
  readonly attributes: TraceAttributes;
  private readonly children: LangfuseTraceHandle[] = [];
  private ended = false;

  constructor(root: LangfuseSpan, attributes: TraceAttributes) {
    this.root = root;
    this.attributes = attributes;
  }

  get traceId(): string {
    return this.root.traceId;
  }

  /**
   * Run fn with this trace's correlating attributes propagated to any
   * observations created inside it (they also parent to the OTEL context
   * active at call time, so combine with root.startObservation or
   * parentSpanContext for correct nesting).
   */
  propagate<T>(fn: () => T): T {
    return propagateAttributes(this.attributes, fn);
  }

  /** Update the root observation (output, level, metadata, ...). */
  update(attributes: LangfuseSpanAttributes): this {
    this.root.update(attributes);
    return this;
  }

  /** Record a point-in-time event under the root observation. */
  event(name: string, attributes?: LangfuseEventAttributes): void {
    this.propagate(() => this.root.startObservation(name, attributes ?? {}, { asType: 'event' }));
  }

  /**
   * Start a child span under the root observation, returned as a handle
   * sharing this trace's attributes so it can be passed on as a parent in
   * its own right. The caller must end() it.
   */
  span(name: string, attributes?: LangfuseSpanAttributes): LangfuseTraceHandle {
    const child = this.propagate(() => this.root.startObservation(name, attributes ?? {}));
    const handle = new LangfuseTraceHandle(child, this.attributes);
    this.children.push(handle);
    return handle;
  }

  /**
   * Update trace-level fields after creation (the v3 TraceClient.update
   * use case). Tags merge into the existing set; both changes also apply to
   * observations created through this handle afterwards.
   */
  updateTrace(update: { name?: string; tags?: string[] }): this {
    if (update.name !== undefined) {
      this.attributes.traceName = update.name;
      this.root.otelSpan.setAttribute(LangfuseOtelSpanAttributes.TRACE_NAME, update.name);
    }
    if (update.tags !== undefined) {
      this.attributes.tags = [...new Set([...(this.attributes.tags ?? []), ...update.tags])];
      this.root.otelSpan.setAttribute(LangfuseOtelSpanAttributes.TRACE_TAGS, this.attributes.tags);
    }
    return this;
  }

  /**
   * End the root observation, optionally applying final attributes first.
   * Nothing is exported to Langfuse until this runs. Idempotent; any child
   * handles left open (e.g. by an exception path) are ended first so they
   * are not lost — their duration just runs long. Generations created by the
   * observeOpenAI middleware are NOT owned by the handle: they end when their
   * API call settles, so end() while a wrapped call is still in flight can
   * orphan that generation — await the call first.
   */
  end(attributes?: LangfuseSpanAttributes): void {
    if (this.ended) return;
    this.ended = true;
    openRoots.delete(this);
    for (const child of this.children) child.end();
    if (attributes) this.root.update(attributes);
    this.root.end();
  }
}

// Roots created by startTrace() that have not been end()ed yet; children are
// covered by their root's sweep and are not registered.
const openRoots = new Set<LangfuseTraceHandle>();

/**
 * End every trace started via startTrace() that is still open. Safety net for
 * process shutdown (call it before flushing/shutting down the OTEL SDK):
 * a root someone forgot to end() would otherwise never export. Forgotten
 * roots get shutdown-time durations, so deterministic end() calls remain the
 * correct primary mechanism.
 */
export function endOpenTraces(): void {
  for (const handle of [...openRoots]) handle.end();
}

/**
 * Start a new trace: a root observation carrying the given correlating
 * attributes. Requires an OpenTelemetry setup with the LangfuseSpanProcessor
 * registered in the host application (see @langfuse/otel).
 */
export function startTrace(name: string, options: StartTraceOptions = {}): LangfuseTraceHandle {
  const { input, metadata, ...given } = options;
  // Own copy (tags included) so later caller-side mutation of the options
  // can't skew the handle; the handle family shares this one object so that
  // updateTrace() reaches children created afterwards.
  const attributes: TraceAttributes = { ...given, tags: given.tags && [...given.tags] };
  if (attributes.traceName === undefined) attributes.traceName = name;
  const root = propagateAttributes(attributes, () => startObservation(name, { input, metadata }));
  const handle = new LangfuseTraceHandle(root, attributes);
  openRoots.add(handle);
  return handle;
}
