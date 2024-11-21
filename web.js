const stream = require('streamx')

const ReadableStreamController = class ReadableStreamController {
  constructor(stream) {
    this._stream = stream
  }

  enqueue(data) {
    this._stream.push(data)
  }
}

exports.ReadableStream = class ReadableStream extends stream.Readable {
  constructor(underlyingSource = {}) {
    super()

    const { start = noop } = underlyingSource

    start(new ReadableStreamController(this))
  }
}

function noop() {}
