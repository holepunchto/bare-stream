const stream = require('streamx')

class ReadableStreamReader {
  constructor(stream) {
    this._stream = stream
  }

  read() {
    return new Promise((resolve, reject) => {
      // sync
      const err = stream.getStreamError(this._stream)
      if (err) return reject(err)

      if (this._stream.destroyed)
        return resolve({ value: undefined, done: true })

      const value = this._stream.read()
      if (value !== null) return resolve({ value, done: false })

      // async
      const onreadable = () => {
        detach()

        const value = this._stream.read()
        value === null
          ? resolve({ value: undefined, done: true })
          : resolve({ value, done: false })
      }

      const onclose = () => {
        detach()

        resolve({ value: undefined, done: true })
      }

      const onerror = (err) => {
        detach()

        reject(err)
      }

      const detach = () => {
        this._stream.off('readable', onreadable)
        this._stream.off('close', onclose)
        this._stream.off('error', onerror)
      }

      this._stream.once('readable', onreadable)
      this._stream.once('close', onclose)
      this._stream.once('error', onerror)
    })
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
  constructor(opts = {}) {
    const { start } = opts

    this._stream = new stream.Readable()
    this._controller = new ReadableStreamController(this._stream)

    if (start) this._start = start.bind(this)

    this._start(this._controller)
  }

  _start(controller) {}

  getReader() {
    return new ReadableStreamReader(this._stream)
  }

  async cancel(reason) {
    return new Promise((resolve) => {
      this._stream.once('close', resolve)
      this._stream.destroy(reason)
    })
  }

  static from(iterable) {
    return stream.Readable.from(iterable)
  }

  [Symbol.asyncIterator]() {
    return this._stream[Symbol.asyncIterator]()
  }
}
