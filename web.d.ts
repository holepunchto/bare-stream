export interface ReadableStreamDefaultReader {
  readonly closed: Promise<void>

  /**
   * @returns Resolves with the next chunk as `{ value, done: false }`, or `{ value: undefined,
   * done: true }` once the stream ends; rejects with the stream's error if the stream is errored.
   */
  read(): Promise<{ value: unknown; done: boolean }>
  releaseLock(): void
  /**
   * @param reason - Reason for the cancellation, passed to the stream's `destroy()`; defaults to a
   * `TypeError` if omitted.
   */
  cancel(reason?: unknown): Promise<void>
}

export class ReadableStreamDefaultReader {
  /**
   * @param stream - The `ReadableStream` to read from.
   */
  constructor(stream: ReadableStream)
}

export interface ReadableStreamDefaultController {
  readonly desiredSize: number

  /**
   * @param data - The chunk to enqueue.
   */
  enqueue(data: unknown): void
  close(): void
  /**
   * @param error - The error to destroy the stream with.
   */
  error(error?: unknown): void
}

export class ReadableStreamDefaultController {
  /**
   * @param stream - The `ReadableStream` the controller manages.
   */
  constructor(stream: ReadableStream)
}

export interface UnderlyingSource<S extends ReadableStream = ReadableStream> {
  /**
   * @param controller - The `ReadableStreamDefaultController` to enqueue data into.
   */
  start?(this: S, controller: ReadableStreamDefaultController): void
  /**
   * @param controller - The `ReadableStreamDefaultController` to enqueue data into.
   */
  pull?(this: S, controller: ReadableStreamDefaultController): void
  /**
   * @param reason - Reason the stream was cancelled.
   */
  cancel?(this: S, reason?: unknown): void
}

export interface CustomQueuingStrategy {
  highWaterMark?: number
  /**
   * @param chunk - The chunk to measure.
   */
  size?: (chunk: unknown) => number
}

export interface ReadableStream extends AsyncIterable<unknown> {
  readonly locked: boolean

  /**
   * @throws {TypeError} thrown if the stream already has an active reader (`locked` is `true`).
   */
  getReader(): ReadableStreamDefaultReader
  /**
   * @param reason - Reason for the cancellation, passed to the stream's `destroy()`; defaults to a
   * `TypeError` if omitted.
   */
  cancel(reason?: unknown): Promise<void>
  /** Split the stream into two independent `ReadableStream` branches. */
  tee(): [ReadableStream, ReadableStream]
  /**
   * @param destination - The `WritableStream` to pipe into.
   */
  pipeTo(destination: WritableStream): Promise<void>
}

export class ReadableStream {
  /**
   * @param underlyingSource - May provide `start`, `pull`, and `cancel` methods, or be an existing
   * `streamx` stream to wrap.
   * @param queuingStrategy - Defaults to a `CountQueuingStrategy` if omitted.
   */
  constructor(underlyingSource?: UnderlyingSource, queuingStrategy?: CustomQueuingStrategy)

  /**
   * Create a `ReadableStream` from an iterable or async iterable.
   * @param iterable - A value, array of values, or async iterable to read from.
   */
  static from(iterable: unknown | unknown[] | AsyncIterable<unknown>): ReadableStream
}

export interface QueuingStrategyOptions {
  highWaterMark?: number
}

interface QueuingStrategy {
  readonly highWaterMark: number

  /**
   * @param chunk - The chunk to measure.
   */
  size(chunk: unknown): number
}

declare class QueuingStrategy {
  constructor(opts?: QueuingStrategyOptions)
}

export { type QueuingStrategy }

export class CountQueuingStrategy extends QueuingStrategy {}

export class ByteLengthQueuingStrategy extends QueuingStrategy {}

/**
 * @param value - The value to test.
 */
export function isReadableStream(value: unknown): value is ReadableStream

/**
 * @param stream - The stream to test.
 */
export function isReadableStreamErrored(stream: ReadableStream): boolean

/**
 * @param stream - The stream to test.
 */
export function isReadableStreamDisturbed(stream: ReadableStream): boolean

export interface WritableStreamDefaultWriter {
  readonly desiredSize: number
  readonly closed: Promise<void>
  readonly ready: Promise<void>

  /**
   * @param chunk - The chunk to write.
   * @returns Resolves once `chunk` has been written and the stream has drained; rejects with the
   * stream's error if the stream is or becomes errored.
   */
  write(chunk: unknown): Promise<void>
  releaseLock(): void
  /**
   * @returns Resolves once the stream has finished closing.
   */
  close(): Promise<void>
  /**
   * @param reason - Reason for the abort, passed to the stream's `destroy()`; defaults to a
   * `TypeError` if omitted.
   */
  abort(reason?: unknown): Promise<void>
}

export class WritableStreamDefaultWriter {
  /**
   * @param stream - The `WritableStream` to write to.
   */
  constructor(stream: WritableStream)
}

export interface WritableStreamDefaultController {
  /**
   * @param err - The error to destroy the stream with.
   */
  error(err?: unknown): void
}

export class WritableStreamDefaultController {
  /**
   * @param stream - The `WritableStream` the controller manages.
   */
  constructor(stream: WritableStream)
}

export interface UnderlyingSink<S extends WritableStream = WritableStream> {
  /**
   * @param controller - The `WritableStreamDefaultController` to signal errors through.
   */
  start?(this: S, controller: WritableStreamDefaultController): void
  /**
   * @param chunk - The chunk to write.
   * @param controller - The `WritableStreamDefaultController` to signal errors through.
   */
  write?(this: S, chunk: unknown, controller: WritableStreamDefaultController): void
  close?(this: S): void
  /**
   * @param reason - Reason the stream was aborted.
   */
  abort?(this: S, reason?: unknown): void
}

export interface WritableStream extends AsyncIterable<unknown> {
  readonly locked: boolean

  /**
   * @throws {TypeError} thrown if the stream already has an active writer (`locked` is `true`).
   */
  getWriter(): WritableStreamDefaultWriter
  /**
   * @param reason - Reason for the abort, passed to the stream's `destroy()`; defaults to a
   * `TypeError` if omitted.
   */
  abort(reason?: unknown): Promise<void>
  /**
   * @returns Resolves once the stream has finished closing.
   */
  close(): Promise<void>
}

export class WritableStream {
  /**
   * @param underlyingSink - May provide `start`, `write`, `close`, and `abort` methods, or be an
   * existing `streamx` stream to wrap.
   */
  constructor(underlyingSink?: UnderlyingSink, queuingStrategy?: CustomQueuingStrategy)
}

/**
 * @param value - The value to test.
 */
export function isWritableStream(value: unknown): value is WritableStream

export interface TransformStreamDefaultController {
  readonly desiredSize: number

  /**
   * @param data - The chunk to enqueue.
   */
  enqueue(data: unknown): void
  /**
   * @param error - The error to destroy the stream with.
   */
  error(error?: unknown): void
  terminate(): void
}

export class TransformStreamDefaultController {
  /**
   * @param stream - The `TransformStream` the controller manages.
   */
  constructor(stream: TransformStream)
}

export interface Transformer<S extends TransformStream = TransformStream> {
  /**
   * @param controller - The `TransformStreamDefaultController` to enqueue output or signal errors
   * through.
   */
  start?(this: S, controller: TransformStreamDefaultController): void
  /**
   * @param chunk - The chunk to transform.
   * @param controller - The `TransformStreamDefaultController` to enqueue output or signal errors
   * through.
   */
  transform?(this: S, chunk: unknown, controller: TransformStreamDefaultController): void
  /**
   * @param controller - The `TransformStreamDefaultController` to enqueue output or signal errors
   * through.
   */
  flush?(this: S, controller: TransformStreamDefaultController): void
}

export interface TransformStream {
  readonly writable: WritableStream
  readonly readable: ReadableStream
}

export class TransformStream {
  /**
   * @param transformer - May provide `start`, `transform`, and `flush` methods.
   */
  constructor(
    transformer?: Transformer,
    writableStrategy?: CustomQueuingStrategy,
    readableStrategy?: CustomQueuingStrategy
  )
}

/**
 * Return `true` if `value` is a web `TransformStream`.
 * @param value - The value to test.
 */
export function isTransformStream(value: unknown): value is TransformStream
