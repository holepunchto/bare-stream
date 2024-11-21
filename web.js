const stream = require('streamx')

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

  [Symbol.asyncIterator]() {
    return this._stream[Symbol.asyncIterator]()
  }
}
