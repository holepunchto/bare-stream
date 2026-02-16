const { Readable, Writable, getStreamError, isStreamx, isDisturbed } = require('streamx')
const tee = require('teex')

const readableKind = Symbol.for('bare.stream.readable.kind')
const writableKind = Symbol.for('bare.stream.writable.kind')

// https://streams.spec.whatwg.org/#readablestreamdefaultreader
exports.ReadableStreamDefaultReader = class ReadableStreamDefaultReader {
  constructor(stream) {
    this.stream = stream

    this._closed = Promise.withResolvers()

    this.stream._stream.once('close', onclose.bind(this)).once('error', onerror.bind(this))

    function onclose() {
      this._closed.resolve()
    }

    function onerror() {
      this._closed.reject()
    }
  }

  get closed() {
    return this._closed.promise
  }

  read() {
    const stream = this.stream._stream

    return new Promise((resolve, reject) => {
      const err = getStreamError(stream)

      if (err) return reject(err)

      if (stream.destroyed) {
        return resolve({ value: undefined, done: true })
      }

      const value = stream.read()

      if (value !== null) {
        return resolve({ value, done: false })
      }

      stream.once('readable', onreadable).once('close', onclose).once('error', onerror)

      function onreadable() {
        const value = stream.read()

        ondone(null, value === null ? { value: undefined, done: true } : { value, done: false })
      }

      function onclose() {
        ondone(null, { value: undefined, done: true })
      }

      function onerror(err) {
        ondone(err, null)
      }

      function ondone(err, value) {
        stream.off('readable', onreadable).off('close', onclose).off('error', onerror)

        if (err) reject(err)
        else resolve(value)
      }
    })
  }

  releaseLock() {
    this._closed.reject()
    this.stream._releaseLock()
  }

  cancel(reason) {
    const stream = this.stream._stream

    if (stream.destroyed) return Promise.resolve()

    return new Promise((resolve) => stream.once('close', resolve).destroy(reason))
  }
}

// https://streams.spec.whatwg.org/#readablestreamdefaultcontroller
exports.ReadableStreamDefaultController = class ReadableStreamDefaultController {
  constructor(stream) {
    this._stream = stream._stream
  }

  get desiredSize() {
    return this._stream._readableState.highWaterMark - this._stream._readableState.buffered
  }

  enqueue(data) {
    this._stream.push(data)
  }

  close() {
    this._stream.push(null)
  }

  error(err) {
    this._stream.destroy(err)
  }
}

// https://streams.spec.whatwg.org/#readablestream
class ReadableStream {
  static get [readableKind]() {
    return 0 // Compatibility version
  }

  constructor(underlyingSource = {}, queuingStrategy) {
    if (isStreamx(underlyingSource)) {
      this._stream = underlyingSource
    } else {
      if (queuingStrategy === undefined) {
        queuingStrategy = new exports.CountQueuingStrategy()
      }

      const { start, pull, cancel } = underlyingSource
      const { highWaterMark = 1, size = defaultSize } = queuingStrategy

      this._stream = new Readable({ highWaterMark, byteLength: size })

      const controller = new exports.ReadableStreamDefaultController(this)

      if (start) {
        this._stream._open = open.bind(this, start.call(this, controller))
      }

      if (pull) {
        this._stream._read = read.bind(this, pull.bind(this, controller))
      }

      if (cancel) {
        this._stream.once('error', cancel)
      }
    }

    this._reader = null
  }

  get [readableKind]() {
    return ReadableStream[readableKind]
  }

  get locked() {
    return this._reader !== null
  }

  getReader() {
    if (this.locked) throw new TypeError('ReadableStream is locked')

    this._reader = new exports.ReadableStreamDefaultReader(this)

    return this._reader
  }

  cancel(reason) {
    if (this._stream.destroyed) return Promise.resolve()

    return new Promise((resolve) => this._stream.once('close', resolve).destroy(reason))
  }

  tee() {
    const [a, b] = tee(this._stream)

    return [new ReadableStream(a), new ReadableStream(b)]
  }

  _releaseLock() {
    this._reader = null
  }

  pipeTo(destination) {
    if (isWritableStream(destination)) destination = destination._stream

    return new Promise((resolve, reject) =>
      this._stream.pipe(destination, (err) => {
        err ? reject(err) : resolve()
      })
    )
  }

  [Symbol.asyncIterator]() {
    return this._stream[Symbol.asyncIterator]()
  }

  static from(iterable) {
    return new ReadableStream(Readable.from(iterable))
  }
}

async function open(starting, cb) {
  try {
    await starting

    cb(null)
  } catch (err) {
    cb(err)
  }
}

async function read(pull, cb) {
  try {
    await pull()

    cb(null)
  } catch (err) {
    cb(err)
  }
}

function defaultSize() {
  return 1
}

exports.ReadableStream = ReadableStream

// https://streams.spec.whatwg.org/#countqueuingstrategy
exports.CountQueuingStrategy = class CountQueuingStrategy {
  constructor(opts = {}) {
    const { highWaterMark = 1 } = opts

    this.highWaterMark = highWaterMark
  }

  size(chunk) {
    return 1
  }
}

// https://streams.spec.whatwg.org/#bytelengthqueuingstrategy
exports.ByteLengthQueuingStrategy = class ByteLengthQueuingStrategy {
  constructor(opts = {}) {
    const { highWaterMark = 16384 } = opts

    this.highWaterMark = highWaterMark
  }

  size(chunk) {
    return chunk.byteLength
  }
}

exports.isReadableStream = function isReadableStream(value) {
  if (value instanceof ReadableStream) return true

  return (
    typeof value === 'object' &&
    value !== null &&
    value[readableKind] === ReadableStream[readableKind]
  )
}

// https://streams.spec.whatwg.org/#is-readable-stream-disturbed
exports.isReadableStreamDisturbed = function isReadableStreamDisturbed(stream) {
  return isDisturbed(stream._stream)
}

// https://streams.spec.whatwg.org/#writablestreamdefaultwriter
exports.WritableStreamDefaultWriter = class WritableStreamDefaultWriter {
  constructor(stream) {
    this._stream = stream._stream
  }

  async write(chunk) {
    this._stream.write(chunk)

    await Writable.drained(this._stream)
  }

  close() {
    if (this._stream.destroyed) return Promise.resolve()

    return new Promise((resolve) => this._stream.once('close', resolve).end())
  }

  get desiredSize() {
    return this._stream._writableState.highWaterMark - this._stream._writableState.buffered
  }
}

// https://streams.spec.whatwg.org/#writablestreamdefaultcontroller
exports.WritableStreamDefaultController = class WritableStreamDefaultController {
  constructor(stream) {
    this._stream = stream._stream
  }
}

// https://streams.spec.whatwg.org/#writablestream
class WritableStream {
  static get [writableKind]() {
    return 0 // Compatibility version
  }

  constructor(underlyingSink = {}, queuingStrategy = {}) {
    if (isStreamx(underlyingSink)) {
      this._stream = underlyingSink
    } else {
      if (queuingStrategy === undefined) {
        queuingStrategy = new exports.CountQueuingStrategy()
      }

      const { start, write, close } = underlyingSink
      const { highWaterMark = 1, size = defaultSize } = queuingStrategy

      this._stream = new Writable({ highWaterMark, byteLength: size })

      this._controller = new exports.WritableStreamDefaultController(this)

      if (start) {
        this._stream._open = open.bind(this, start.call(this, this._controller))
      }

      if (write) {
        this._stream._write = _write.bind(this, write)
      }

      if (close) {
        this._stream._destroy = destroy.bind(this, close.call(this))
      }
    }
  }

  get [writableKind]() {
    return WritableStream[writableKind]
  }

  getWriter() {
    return new exports.WritableStreamDefaultWriter(this)
  }

  close() {
    if (this._stream.destroyed) return Promise.resolve()

    return new Promise((resolve) => this._stream.once('close', resolve).end())
  }
}

async function _write(fn, data, cb) {
  try {
    await fn(data, this._controller)

    cb(null)
  } catch (err) {
    cb(err)
  }
}

async function destroy(closing, cb) {
  try {
    await closing

    cb(null)
  } catch (err) {
    cb(err)
  }
}

exports.WritableStream = WritableStream

const isWritableStream = function isWritableStream(value) {
  if (value instanceof WritableStream) return true

  return (
    typeof value === 'object' &&
    value !== null &&
    value[writableKind] === WritableStream[writableKind]
  )
}

exports.isWritableStream = isWritableStream
