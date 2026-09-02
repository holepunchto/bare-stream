import EventEmitter, { EventMap } from 'bare-events'
import Buffer, { BufferEncoding } from 'bare-buffer'
import { AbortSignal } from 'bare-abort-controller'

import { ReadableStream, WritableStream, CustomQueuingStrategy } from './web'

type StreamEncoding = BufferEncoding | 'buffer'

interface StreamCallback {
  (err: Error | null): void
}

interface StreamEvents extends EventMap {
  close: []
  error: [err: Error]
}

interface StreamOptions<S extends Stream = Stream> {
  eagerOpen?: boolean
  highWaterMark?: number
  signal?: AbortSignal
  /**
   * @param cb - Called with an error, or `null`, once opening finishes.
   */
  open?(this: S, cb: StreamCallback): void
  predestroy?(this: S): void
  /**
   * @param err - The error the stream is being destroyed with, or `null` for a clean destroy.
   * @param cb - Called with an error, or `null` on success.
   */
  destroy?(this: S, err: Error | null, cb: StreamCallback): void
}

interface Stream<M extends StreamEvents = StreamEvents> extends EventEmitter<M> {
  /**
   * @param cb - Called with an error, or `null`, once opening finishes.
   */
  _open(cb: StreamCallback): void
  _predestroy(): void
  /**
   * @param err - The error the stream is being destroyed with, or `null` for a clean destroy.
   * @param cb - Called with an error, or `null` on success.
   */
  _destroy(err: Error | null, cb: StreamCallback): void

  readonly readable: boolean
  readonly writable: boolean
  readonly destroyed: boolean
  readonly destroying: boolean

  /**
   * @param err - The error to destroy the stream with; omit or pass `null` for a clean destroy.
   */
  destroy(err?: Error | null): void
}

declare class Stream {}

interface ReadableEvents extends StreamEvents {
  /** Emitted with each chunk of data read from the stream. */
  data: [data: unknown]
  /** Emitted once the readable side has ended and no more data will be read. */
  end: []
  /** Emitted when data is available to be read from the stream. */
  readable: []
  /** Emitted with the destination when the stream begins piping into it. */
  piping: [dest: Writable]
}

interface ReadableOptions<S extends Readable = Readable> extends StreamOptions<S> {
  encoding?: BufferEncoding
  /**
   * @returns Resolves with the next chunk as `{ value, done: false }`, or `{ value: undefined,
   * done: true }` once the stream ends; rejects with the stream's error if the stream is errored.
   */
  read?(this: S, size: number): void
}

interface ReadableFromWebOptions {
  encoding?: BufferEncoding
  signal?: AbortSignal
}

interface ReadableToWebOptions {
  strategy?: CustomQueuingStrategy
}

interface Readable<M extends ReadableEvents = ReadableEvents>
  extends Stream<M>, AsyncIterable<unknown> {
  _read(size: number): void

  /** `true` when the stream is no longer readable. */
  readonly closed: boolean
  /** The error the stream was destroyed with, or `null`. */
  readonly errored: Error | null

  /**
   * @param data - Data to add to the buffer, or `null` to end the stream.
   * @param encoding - Encoding used to convert a string `data` to a `Buffer`; defaults to `'utf8'`.
   */
  push(data: unknown | null, encoding?: BufferEncoding): boolean
  /**
   * @param data - Data to prepend to the buffer, or `null` to end the stream.
   * @param encoding - Encoding used to convert a string `data` to a `Buffer`; defaults to `'utf8'`.
   */
  unshift(data: unknown | null, encoding?: BufferEncoding): boolean
  read(): unknown | null

  resume(): this
  pause(): this

  /**
   * @param dest - The destination stream to write into.
   * @param cb - Called with an error, or `null` on success.
   */
  pipe<S extends Writable>(dest: S, cb?: StreamCallback): S

  /**
   * @param encoding - Encoding used to decode emitted data to strings.
   */
  setEncoding(encoding: BufferEncoding): void
}

declare class Readable<M extends ReadableEvents = ReadableEvents> extends Stream<M> {
  /** A readable stream. */
  constructor(opts?: ReadableOptions)

  /**
   * Create a readable stream from `data`, which may be a value, an array of values, or an async
   * iterable.
   * @param data - A value, array of values, or async iterable to read from.
   */
  static from(data: unknown | unknown[] | AsyncIterable<unknown>, opts?: ReadableOptions): Readable

  /**
   * @param rs - The stream to check.
   */
  static isBackpressured(rs: Readable): boolean

  /**
   * @param rs - The stream to check.
   */
  static isPaused(rs: Readable): boolean

  /**
   * Convert a web `ReadableStream` into a `Readable`.
   * @param readableStream - The web `ReadableStream` to convert.
   * @param opts - Options for the conversion; supports `encoding` and `signal`, matching
   * `ReadableOptions`.
   */
  static fromWeb(readableStream: ReadableStream, opts?: ReadableFromWebOptions): Readable

  /**
   * Convert a `Readable` into a web `ReadableStream`.
   * @param readable - The `Readable` to convert.
   * @param opts - Options for the conversion; `strategy` is a custom queuing strategy passed
   * through to the `ReadableStream` constructor.
   */
  static toWeb(readable: Readable, opts?: ReadableToWebOptions): ReadableStream
}

interface WritableEvents extends StreamEvents {
  /** Emitted when the write buffer has drained and writing can resume. */
  drain: []
  /** Emitted once the writable side has finished and all writes have flushed. */
  finish: []
  /** Emitted with the source readable when a stream begins piping into this stream. */
  pipe: [src: Readable]
}

interface WritableOptions<S extends Writable = Writable> extends StreamOptions<S> {
  /**
   * @param data - The chunk to write.
   * @param encoding - Encoding of `data`, or `'buffer'` if it is not a string.
   * @param cb - Called with an error, or `null` on success.
   */
  write?(this: S, data: unknown, encoding: StreamEncoding, cb: StreamCallback): void
  /**
   * @param batch - Queued chunks to write, each with its `chunk` and `encoding`.
   * @param cb - Called with an error, or `null` on success.
   */
  writev?(this: S, batch: { chunk: unknown; encoding: StreamEncoding }[], cb: StreamCallback): void
  /**
   * @param cb - Called with an error, or `null` on success.
   */
  final?(this: S, cb: StreamCallback): void
}

interface WritableFromWebOptions {
  signal?: AbortSignal
}

interface Writable<M extends WritableEvents = WritableEvents> extends Stream<M> {
  /**
   * @param data - The chunk to write.
   * @param encoding - Encoding of `data`, or `'buffer'` if it is not a string.
   * @param cb - Called with an error, or `null` on success.
   */
  _write(data: unknown, encoding: StreamEncoding, cb: StreamCallback): void
  /**
   * @param batch - Queued chunks to write, each with its `chunk` and `encoding`.
   * @param cb - Called with an error, or `null` on success.
   */
  _writev(batch: { chunk: unknown; encoding: StreamEncoding }[], cb: StreamCallback): void
  /**
   * @param cb - Called with an error, or `null` on success.
   */
  _final(cb: StreamCallback): void

  /** `true` when the stream is no longer writable. */
  readonly closed: boolean
  readonly errored: Error | null

  /**
   * Write `data` to the stream. If `data` is a string, it is encoded using `encoding`, defaulting
   * to `'utf8'`. Returns `false` if the stream is backpressured. The optional `cb` is called once
   * the write has drained.
   * @param data - Data to write. If a string, it is encoded using `encoding`.
   * @param encoding - Encoding used to convert a string `data` to a `Buffer`; defaults to `'utf8'`.
   * @param cb - Called with an error, or `null`, once the write has drained.
   */
  write(data: unknown, encoding?: BufferEncoding, cb?: StreamCallback): boolean
  write(data: unknown, cb?: StreamCallback): boolean

  /**
   * Signal that no more data will be written. If `data` is provided it is written first. The
   * optional `cb` is called once the stream has finished.
   * @param cb - Called with an error, or `null`, once the stream has finished.
   */
  end(cb?: StreamCallback): this
  end(data: unknown, encoding?: BufferEncoding, cb?: StreamCallback): this
  end(data: unknown, cb?: StreamCallback): this

  cork(): void
  uncork(): void
}

declare class Writable<M extends WritableEvents = WritableEvents> extends Stream<M> {
  /** A writable stream. */
  constructor(opts?: WritableOptions)

  /**
   * @param ws - The stream to check.
   */
  static isBackpressured(ws: Writable): boolean

  /**
   * Returns a promise that resolves once the stream has drained.
   * @param ws - The stream to wait on.
   */
  static drained(ws: Writable): Promise<boolean>

  /**
   * Convert a web `WritableStream` into a `Writable`.
   * @param writableStream - The web `WritableStream` to convert.
   * @param opts - Options for the conversion; supports `signal`, matching `WritableOptions`.
   */
  static fromWeb(writableStream: WritableStream, opts?: WritableFromWebOptions): Writable

  /**
   * Convert a `Writable` into a web `WritableStream`.
   * @param writable - The `Writable` to convert.
   */
  static toWeb(writable: Writable): WritableStream
}

interface DuplexEvents extends ReadableEvents, WritableEvents {}

interface DuplexOptions<S extends Duplex = Duplex> extends ReadableOptions<S>, WritableOptions<S> {}

interface DuplexFromWebOptions extends ReadableFromWebOptions, WritableFromWebOptions {}

interface Duplex<M extends DuplexEvents = DuplexEvents> extends Readable<M>, Writable<M> {}

declare class Duplex<M extends DuplexEvents = DuplexEvents> extends Stream<M> {
  /**
   * A stream that is both readable and writable. Accepts the combined options of `Readable` and
   * `Writable`.
   */
  constructor(opts?: DuplexOptions)

  /**
   * Convert a pair of web `ReadableStream` and `WritableStream` into a `Duplex`.
   * @param opts - Options for the conversion; combines the `Readable` and `Writable` conversion
   * options (`encoding`, `signal`).
   */
  static fromWeb(
    { readable: ReadableStream, writable: Writable },
    opts?: DuplexFromWebOptions
  ): Readable

  static toWeb(readable: Readable, opts?: ReadableToWebOptions): ReadableStream
}

interface TransformEvents extends DuplexEvents {}

interface TransformOptions<S extends Transform = Transform> extends DuplexOptions<S> {
  /**
   * @param data - The chunk to transform.
   * @param encoding - Encoding of `data`, or `'buffer'` if it is not a string.
   * @param cb - Called with an error, or `null` on success.
   */
  transform?(this: S, data: unknown, encoding: StreamEncoding, cb: StreamCallback): void
  /**
   * @param cb - Called with an error, or `null`, once flushing finishes.
   */
  flush?(this: S, cb: StreamCallback): void
}

interface Transform<M extends TransformEvents = TransformEvents> extends Duplex<M> {
  /**
   * @param data - The chunk to transform.
   * @param encoding - Encoding of `data`, or `'buffer'` if it is not a string.
   * @param cb - Called with an error, or `null` on success.
   */
  _transform(data: unknown, encoding: StreamEncoding, cb: StreamCallback): void
  /**
   * @param cb - Called with an error, or `null`, once flushing finishes.
   */
  _flush(cb: StreamCallback): void
}

declare class Transform<M extends TransformEvents = TransformEvents> extends Duplex<M> {
  /** A duplex stream where output is computed from input. */
  constructor(opts?: TransformOptions)
}

type Pipeline<S extends Writable> = [src: Readable, ...transforms: Duplex[], dest: S]

declare namespace Stream {
  export {
    Stream,
    StreamEvents,
    StreamOptions,
    Readable,
    ReadableEvents,
    ReadableOptions,
    Writable,
    WritableEvents,
    WritableOptions,
    Duplex,
    DuplexEvents,
    DuplexOptions,
    Transform,
    TransformEvents,
    TransformOptions,
    Transform as PassThrough
  }

  /**
   * Pipe a series of streams together, propagating errors and cleaning up on completion. `streams`
   * is a `Readable` source, zero or more `Duplex` transforms, and a `Writable` destination. Returns
   * the destination stream. `cb` is called when the pipeline finishes or errors.
   * @param streams - A `Readable` source, zero or more `Duplex` transforms, and a `Writable`
   * destination.
   * @param cb - Called with an error, or `null`, once the pipeline finishes or errors.
   */
  export function pipeline<S extends Writable>(streams: Pipeline<S>, cb?: StreamCallback): S

  export function pipeline<S extends Writable>(...args: Pipeline<S>): S

  export function pipeline<S extends Writable>(...args: [...Pipeline<S>, cb: StreamCallback]): S

  /**
   * Create a pair of linked `Duplex` streams. Data written to `a` is readable from `b` and vice
   * versa. `options` are passed to each side.
   * @param opts - Passed to both ends of the pair.
   */
  export function duplexPair(opts?: DuplexOptions): [Duplex, Duplex]

  /**
   * Invoke `cb` once `stream` is no longer readable or writable, or has errored. Returns a function
   * that detaches the listeners.
   * @param stream - The stream to wait on.
   * @param opts - Set `cleanup: true` to detach the listeners automatically once `cb` runs.
   * @param cb - Called with an error, or `null`, once `stream` finishes.
   */
  export function finished(
    stream: Stream,
    opts: { cleanup?: boolean },
    cb: StreamCallback
  ): () => void

  export function finished(stream: Stream, cb: StreamCallback): () => void

  /**
   * @param stream - The stream to test.
   */
  export function isStream(stream: unknown): stream is Stream

  /**
   * @param stream - The stream to test.
   */
  export function isEnded(stream: Stream): boolean

  /**
   * @param stream - The stream to test.
   */
  export function isFinished(stream: Stream): boolean

  /**
   * @param stream - The stream to test.
   */
  export function isDisturbed(stream: Stream): boolean

  /**
   * @param stream - The stream to test.
   */
  export function isErrored(stream: Stream): boolean

  /**
   * @param stream - The stream to test.
   */
  export function isReadable(stream: Stream): boolean

  /**
   * Return `true` if `stream` is writable.
   * @param stream - The stream to test.
   */
  export function isWritable(stream: Stream): boolean

  /**
   * Return the error a stream was destroyed with, or `null`.
   * @param stream - The stream to inspect.
   */
  export function getStreamError(stream: Stream, opts?: { all?: boolean }): Error | null

  /**
   * Destroy `stream` when `signal` aborts, using `signal.reason` as the destruction error. Returns
   * `stream`.
   * @param signal - The `AbortSignal` that destroys `stream` on abort.
   * @param stream - The stream to destroy when `signal` aborts.
   */
  export function addAbortSignal<S extends Stream>(signal: AbortSignal, stream: S): S
}

export = Stream
