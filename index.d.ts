import EventEmitter, { EventMap } from 'bare-events'
import Buffer, { BufferEncoding } from 'bare-buffer'

type StreamEncoding = BufferEncoding | 'buffer'

interface StreamCallback {
  (err: Error | null): void
}

interface StreamEvents extends EventMap {
  close: []
  error: [err: Error]
}

interface StreamOptions<S extends Stream> {
  eagerOpen?: boolean
  signal?: AbortSignal
  open?(this: S, cb: StreamCallback): void
  predestroy?(this: S): void
  destroy?(this: S, err: Error | null, cb: StreamCallback): void
}

interface Stream<M extends StreamEvents = StreamEvents>
  extends EventEmitter<M> {
  _open(cb: StreamCallback): void
  _predestroy(): void
  _destroy(err: Error | null, cb: StreamCallback): void

  readonly readable: boolean
  readonly writable: boolean
  readonly destroyed: boolean
  readonly destroying: boolean

  destroy(err?: Error | null): void
}

declare class Stream {}

interface ReadableEvents extends StreamEvents {
  data: [data: Buffer | string]
  end: []
  readable: []
  piping: [dest: Writable]
}

interface ReadableOptions<S extends Readable = Readable>
  extends StreamOptions<S> {
  encoding?: BufferEncoding
  highWaterMark?: number
  read?(this: S, size: number): void
}

interface Readable<M extends ReadableEvents = ReadableEvents>
  extends Stream<M>,
    AsyncIterable<Buffer> {
  _read(size: number): void

  push(data: string, encoding?: BufferEncoding): boolean
  push(data: Buffer | null): boolean

  unshift(data: string, encoding?: BufferEncoding): boolean
  unshift(data: Buffer | null): boolean

  read(): Buffer | string | null

  resume(): this
  pause(): this

  pipe<S extends Writable>(dest: S, cb?: StreamCallback): S

  setEncoding(encoding: BufferEncoding): void
}

declare class Readable<
  M extends ReadableEvents = ReadableEvents
> extends Stream<M> {
  constructor(opts?: ReadableOptions)

  static from(
    data:
      | (Buffer | string)
      | (Buffer | string)[]
      | AsyncIterable<Buffer | string>,
    opts?: ReadableOptions
  ): Readable

  static isBackpressured(rs: Readable): boolean

  static isPaused(rs: Readable): boolean
}

interface WritableEvents extends StreamEvents {
  drain: []
  finish: []
  pipe: [src: Readable]
}

interface WritableOptions<S extends Writable = Writable>
  extends StreamOptions<S> {
  write?(
    this: S,
    data: Buffer,
    encoding: StreamEncoding,
    cb: StreamCallback
  ): void
  writev?(
    this: S,
    batch: { chunk: Buffer; encoding: StreamEncoding }[],
    cb: StreamCallback
  ): void
  final?(this: S, cb: StreamCallback): void
}

interface Writable<M extends WritableEvents = WritableEvents>
  extends Stream<M> {
  _write(data: Buffer, encoding: StreamEncoding, cb: StreamCallback): void
  _writev(
    batch: { chunk: Buffer; encoding: StreamEncoding }[],
    cb: StreamCallback
  ): void
  _final(cb: StreamCallback): void

  readonly destroyed: boolean

  write(data: string, encoding?: BufferEncoding, cb?: StreamCallback): boolean
  write(data: Buffer, cb?: StreamCallback): boolean

  end(cb?: StreamCallback): this
  end(data: string, encoding?: BufferEncoding, cb?: StreamCallback): this
  end(data: Buffer, cb?: StreamCallback): this

  cork(): void
  uncork(): void
}

declare class Writable<
  M extends WritableEvents = WritableEvents
> extends Stream<M> {
  constructor(opts?: WritableOptions)

  static isBackpressured(ws: Writable): boolean

  static drained(ws: Writable): Promise<boolean>
}

interface DuplexEvents extends ReadableEvents, WritableEvents {}

interface DuplexOptions<S extends Duplex = Duplex>
  extends ReadableOptions<S>,
    WritableOptions<S> {}

interface Duplex<M extends DuplexEvents = DuplexEvents>
  extends Readable<M>,
    Writable<M> {}

declare class Duplex<M extends DuplexEvents = DuplexEvents> extends Stream<M> {
  constructor(opts?: DuplexOptions)
}

interface TransformEvents extends DuplexEvents {}

interface TransformOptions<S extends Transform = Transform>
  extends DuplexOptions<S> {
  transform?(
    this: S,
    data: Buffer,
    encoding: StreamEncoding,
    cb: StreamCallback
  ): void
  flush?(this: S, cb: StreamCallback): void
}

interface Transform<M extends TransformEvents = TransformEvents>
  extends Duplex<M> {
  _transform(data: Buffer, encoding: StreamEncoding, cb: StreamCallback): void
  _flush(cb: StreamCallback): void
}

declare class Transform<
  M extends TransformEvents = TransformEvents
> extends Duplex<M> {
  constructor(opts?: TransformOptions)
}

declare namespace Stream {
  export {
    Stream,
    Readable,
    Writable,
    Duplex,
    Transform,
    Transform as PassThrough
  }

  export function pipeline(streams: Stream[], done?: StreamCallback): Stream

  export function pipeline(
    ...args: [stream: Stream, ...streams: Stream[], done: StreamCallback]
  ): Stream

  export function pipeline(stream: Stream, ...streams: Stream[]): Stream

  export function finished(
    stream: Stream,
    opts: { cleanup?: boolean },
    cb: StreamCallback
  ): () => void

  export function finished(stream: Stream, cb: StreamCallback): () => void

  export function isStream(stream: unknown): stream is Stream

  export function isEnded(stream: Stream): boolean

  export function isFinished(stream: Stream): boolean

  export function isDisturbed(stream: Stream): boolean

  export function getStreamError(
    stream: Stream,
    opts?: { all?: boolean }
  ): Error | null
}

export = Stream
