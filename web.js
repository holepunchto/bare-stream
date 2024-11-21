const { Readable, getStreamError } = require('streamx')

class ReadableStreamReader {
  constructor(stream) {
    this._stream = stream
  }

  read() {
    const stream = this._stream

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

      stream
        .once('readable', onreadable)
        .once('close', onclose)
        .once('error', onerror)

      function onreadable() {
        const value = stream.read()

        ondone(
          null,
          value === null
            ? { value: undefined, done: true }
            : { value, done: false }
        )
      }

      function onclose() {
        ondone(null, { value: undefined, done: true })
      }

      function onerror(err) {
        ondone(err, null)
      }

      function ondone(err, value) {
        stream
          .off('readable', onreadable)
          .off('close', onclose)
          .off('error', onerror)

        if (err) reject(err)
        else resolve(value)
      }
    })
  }

  cancel(reason) {
    if (this._stream.destroyed) return Promise.resolve()

    return new Promise((resolve) =>
      this._stream.once('close', resolve).destroy(reason)
    )
  }
}

class ReadableStreamController {
  constructor(stream) {
    this._stream = stream
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

exports.ReadableStream = class ReadableStream {
  constructor(
    underlyingSource = {},
    queuingStrategy = {},
    stream = new Readable()
  ) {
    const { start } = underlyingSource

    this._stream = stream
    this._controller = new ReadableStreamController(this._stream)

    if (start) this._start = start.bind(this)

    this._start(this._controller)
  }

  _start(controller) {}

  getReader() {
    return new ReadableStreamReader(this._stream)
  }

  cancel(reason) {
    if (this._stream.destroyed) return Promise.resolve()

    return new Promise((resolve) =>
      this._stream.once('close', resolve).destroy(reason)
    )
  }

  pipeTo(destination) {
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
    return new ReadableStream(undefined, undefined, Readable.from(iterable))
  }
}
