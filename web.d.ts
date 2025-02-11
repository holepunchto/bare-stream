import { Writable } from '.'

export interface ReadableStreamDefaultReader {
  read(): Promise<unknown>
  cancel(reason?: Error | string | null): Promise<void>
}

export class ReadableStreamDefaultReader {
  constructor(stream: ReadableStream)
}

export interface ReadableStreamDefaultController {
  readonly desiredSize: number

  enqueue(data: unknown): void
  close(): void
  error(error?: Error | null): void
}

export class ReadableStreamDefaultController {
  constructor(stream: ReadableStream)
}

export interface UnderlyingSource<S extends ReadableStream = ReadableStream> {
  start?(this: S, controller: ReadableStreamDefaultController): void
  pull?(this: S, controller: ReadableStreamDefaultController): void
}

export interface QueuingStrategy {
  highWaterMark?: number
  size?: (chunk: unknown) => number
}

export interface ReadableStream extends AsyncIterable<unknown> {
  getReader(): ReadableStreamDefaultReader
  cancel(reason?: Error | string | null): Promise<void>
  pipeTo(destination: Writable): Promise<void>
}

export class ReadableStream {
  constructor(
    underlyingSource?: UnderlyingSource,
    queuingStrategy?: QueuingStrategy
  )

  static from(
    iterable: unknown | unknown[] | AsyncIterable<unknown>
  ): ReadableStream
}

export interface WebStreamStrategyOptions {
  highWaterMark?: number
}

declare interface WebStreamStrategy {
  readonly highWaterMark: number

  size(chunk: unknown): number
}

declare class WebStreamStrategy {
  constructor(opts?: WebStreamStrategyOptions)
}

export class CountQueuingStrategy extends WebStreamStrategy {}

export class ByteLengthQueuingStrategy extends WebStreamStrategy {}

export function isReadableStreamDisturbed(stream: ReadableStream): boolean
