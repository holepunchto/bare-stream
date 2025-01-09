import EventEmitter from 'bare-events'
import Buffer, { BufferEncoding } from 'bare-buffer'

// duplicated from 'bare-events'
declare interface EventMap {
  [event: string | symbol]: unknown[]
}

type StreamOptions = {
  destroy?: Stream['_destroy']
  eagerOpen?: boolean
  open?: Stream['_open']
  predestroy?: Stream['_predestroy']
  signal?: AbortSignal
}

declare interface Stream<M extends EventMap = EventMap>
  extends EventEmitter<M> {
  _open(cb: (err?: Error | null) => void): void
  _destroy: (
    this: this,
    err: Error | null,
    cb: (err?: Error | null) => void
  ) => void
  _predestroy(): void

  get readable(): boolean
  get writable(): boolean
  get destroyed(): boolean
  get destroying(): boolean

  destroy(err?: Error | null): void
}

declare class Stream {
  constructor(opts?: StreamOptions)
}

type ReadableOptions = {
  byteLength?: (data: unknown) => number
  byteLengthReadable?: (data: unknown) => number
  encoding?: BufferEncoding
  highWaterMark?: number
  map?: (data: unknown) => unknown
  mapReadable?: (data: unknown) => unknown
  read?: Readable['_read']
} & StreamOptions

declare interface Readable<T = Buffer | string>
  extends Stream<{
    data: [data: T | null]
    close: []
    end: []
    error: [err: Error]
    readable: []
    piping: [dest: unknown]
  }> {
  _read(this: this, size: number): void

  push(chunk: T | null, encoding?: BufferEncoding): boolean

  unshift(chunk: T | null, encoding?: BufferEncoding): boolean

  read(): T | null

  resume(): this
  pause(): this

  pipe<A extends Writable | Duplex>(dest: A, cb?: (err: Error) => void): A

  setEncoding(encoding: BufferEncoding): void

  [Symbol.asyncIterator](): AsyncIterator<T>
}

declare class Readable {
  static from(data: unknown | unknown[], opts?: ReadableOptions): Readable

  static isBackpressured(rs: Readable): boolean
  static isPaused(rs: Readable): boolean

  constructor(opts?: ReadableOptions)
}

type WritableOptions = {
  final?: Writable['_final']
  mapWritable?: (data: unknown) => unknown
  write?: Writable['_write']
  writev?: Writable['_writev']
} & StreamOptions

declare interface Writable<T = Buffer | string>
  extends Stream<{
    drain: []
    finish: []
    close: []
    error: [err: Error]
    pipe: [src: Readable]
  }> {
  readonly destroyed: boolean

  _writev(this: this, batch: T[], cb: (err?: Error | null) => void): void
  _write(
    this: this,
    data: T,
    encoding: BufferEncoding,
    cb: (err?: Error | null) => void
  ): void
  _final(this: this, cb: (err?: Error | null) => void): void

  write(chunk: T, encoding?: BufferEncoding, cb?: () => void): boolean
  write(chunk: T, cb?: () => void): boolean

  end(chunk: T, encoding?: BufferEncoding, cb?: () => void): this
  end(chunk: T, cb?: () => void): this
  end(cb?: () => void): this

  cork(): void
  uncork(): void
}

declare class Writable {
  static isBackpressured(ws: Writable): Promise<boolean>
  static drained(ws: Writable): Promise<boolean>

  constructor(opts?: WritableOptions)
}

type DuplexOptions = ReadableOptions & WritableOptions

declare interface Duplex<T = Buffer | string>
  extends Stream<{
    close: []
    data: [data: T | null]
    drain: []
    end: []
    error: [err: Error]
    finish: []
    pipe: [src: Readable]
    piping: [dest: unknown]
    readable: []
  }> {
  _read(this: this, size: number): void
  _writev(this: this, batch: T[], cb: (err?: Error | null) => void): void
  _write(this: this, data: T, cb: (err?: Error | null) => void): void
  _final(this: this, cb: (err?: Error | null) => void): void

  write(chunk: T, encoding?: BufferEncoding, cb?: () => void): boolean
  write(chunk: T, cb?: () => void): boolean

  end(chunk: T, encoding?: BufferEncoding, cb?: () => void): this
  end(chunk: T, cb?: () => void): this
  end(cb?: () => void): this

  push(chunk: T | null, encoding?: BufferEncoding): boolean
  unshift(chunk: T | null, encoding?: BufferEncoding): boolean

  read(): T | null

  resume(): this
  pause(): this

  pipe<A extends Stream>(dest: A, cb?: (err: Error) => void): A

  setEncoding(encoding: BufferEncoding): void

  cork(): void
  uncork(): void

  [Symbol.asyncIterator](): AsyncIterator<T>
}

declare class Duplex {
  constructor(opts?: DuplexOptions)
}

type TransformOptions = {
  flush?: Transform['_flush']
  transform?: Transform['_transform']
} & DuplexOptions

declare interface Transform<T = Buffer | string> extends Duplex {
  _transform(
    this: this,
    data: T,
    encoding: BufferEncoding,
    cb: (err?: Error | null) => void
  ): void
  _flush(cb: (this: this, err: Error | null) => void): void
}

declare class Transform {
  constructor(opts?: TransformOptions)
}

declare class Pipeline {
  constructor(src: Stream, dst: Stream, cb: (err?: Error | null) => void)

  finished(): void

  done(stream: Stream, err: Error): void
}

declare namespace Stream {
  export {
    Pipeline,
    Stream,
    Readable,
    Writable,
    Duplex,
    Transform,
    Transform as PassThrough
  }

  export function finished(
    stream: Stream,
    opts: { cleanup?: boolean },
    cb: (err?: Error | null) => void
  ): () => void

  export function finished(
    stream: Stream,
    cb: (err?: Error | null) => void
  ): () => void

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
