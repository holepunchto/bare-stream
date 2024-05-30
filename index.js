const stream = require('streamx')

exports.Writable = class Writable extends stream.Writable {
  constructor (opts = {}) {
    super({ ...opts, mapWritable })

    if (this._construct) this._open = this._construct

    if (this._writev !== stream.Writable.prototype._writev) {
      this._writev = adaptWritev(this._writev)
    }

    if (this._write !== stream.Writable.prototype._write) {
      this._write = adaptWrite(this._write)
    }

    if (this._destroy !== stream.Writable.prototype._destroy) {
      this._destroy = adaptDestroy(this._destroy)
    }
  }
}

function adaptWritev (writev) {
  return function (batch, cb) {
    writev(batch.map(chunk => ({ chunk, encoding: 'buffer' })), cb)
  }
}

function adaptWrite (write) {
  return function (data, cb) {
    write(data, 'buffer', cb)
  }
}

function adaptDestroy (destroy) {
  return function (cb) {
    destroy(stream.getStreamError(this), cb)
  }
}

function mapWritable (data) {
  return typeof data === 'string' ? Buffer.from(data) : data
}
