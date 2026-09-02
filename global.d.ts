import * as web from './web'

declare global {
  /**
   * A web readable stream. `underlyingSource` may provide `start`, `pull`, and `cancel` methods, or
   * be an existing `streamx` stream to wrap. `queuingStrategy` defaults to a
   * `CountQueuingStrategy`.
   */
  type ReadableStream = web.ReadableStream
  /**
   * The controller passed to `start` and `pull`, exposing `desiredSize`, `enqueue(data)`,
   * `close()`, and `error([err])`.
   */
  type ReadableStreamDefaultController = web.ReadableStreamDefaultController
  /**
   * A reader over a `ReadableStream`, exposing `closed`, `read()`, `releaseLock()`, and
   * `cancel([reason])`.
   */
  type ReadableStreamDefaultReader = web.ReadableStreamDefaultReader

  type CountQueuingStrategy = web.CountQueuingStrategy
  type ByteLengthQueuingStrategy = web.ByteLengthQueuingStrategy

  /**
   * A web writable stream. `underlyingSink` may provide `start`, `write`, `close`, and `abort`
   * methods, or be an existing `streamx` stream to wrap.
   */
  type WritableStream = web.WritableStream
  /** The controller passed to `start` and `write`, exposing `error([err])`. */
  type WritableStreamDefaultController = web.WritableStreamDefaultController
  /**
   * A writer over a `WritableStream`, exposing `desiredSize`, `closed`, `ready`, `write(chunk)`,
   * `releaseLock()`, `close()`, and `abort([reason])`.
   */
  type WritableStreamDefaultWriter = web.WritableStreamDefaultWriter

  /**
   * A web transform stream. `transformer` may provide `start`, `transform`, and `flush` methods.
   * Exposes `readable` and `writable` properties.
   */
  type TransformStream = web.TransformStream
  /**
   * The controller passed to `start`, `transform`, and `flush`, exposing `desiredSize`,
   * `enqueue(data)`, `error([err])`, and `terminate()`.
   */
  type TransformStreamDefaultController = web.TransformStreamDefaultController

  const ReadableStream: typeof web.ReadableStream
  const ReadableStreamDefaultController: typeof web.ReadableStreamDefaultController
  const ReadableStreamDefaultReader: typeof web.ReadableStreamDefaultReader

  const CountQueuingStrategy: typeof web.CountQueuingStrategy
  const ByteLengthQueuingStrategy: typeof web.ByteLengthQueuingStrategy

  const WritableStream: typeof web.WritableStream
  const WritableStreamDefaultController: typeof web.WritableStreamDefaultController
  const WritableStreamDefaultWriter: typeof web.WritableStreamDefaultWriter

  const TransformStream: typeof web.TransformStream
  const TransformStreamDefaultController: typeof web.TransformStreamDefaultController
}
