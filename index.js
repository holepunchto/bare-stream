const stream = require('streamx')

const defaultEncoding = 'utf8'

exports.pipeline = stream.pipeline

exports.isStream = stream.isStream

exports.Readable = class Readable extends stream.Readable {
  constructor (opts = {}) {
    super(opts)

    if (this._construct) this._open = this._construct

    if (this._read !== stream.Readable.prototype._read) {
      this._read = read.bind(this, this._read)
    }

    if (this._destroy !== stream.Stream.prototype._destroy) {
      this._destroy = destroy.bind(this, this._destroy)
    }
  }

  push (chunk, encoding) {
    if (typeof chunk === 'string') {
      chunk = Buffer.from(chunk, encoding || defaultEncoding)
    }

    return super.push(chunk)
  }

  unshift (chunk, encoding) {
    if (typeof chunk === 'string') {
      chunk = Buffer.from(chunk, encoding || defaultEncoding)
    }

    super.unshift(chunk)
  }
}

exports.Writable = class Writable extends stream.Writable {
  constructor (opts = {}) {
    super(opts)

    if (this._construct) this._open = this._construct

    if (this._writev !== stream.Writable.prototype._writev) {
      this._writev = writev.bind(this, this._writev)
    }

    if (this._write !== stream.Writable.prototype._write) {
      this._write = write.bind(this, this._write)
    }

    if (this._destroy !== stream.Stream.prototype._destroy) {
      this._destroy = destroy.bind(this, this._destroy)
    }
  }

  write (chunk, encoding, cb) {
    if (typeof encoding === 'function') {
      cb = encoding
      encoding = null
    }

    if (typeof chunk === 'string') {
      chunk = Buffer.from(chunk, encoding || defaultEncoding)
    }

    const result = super.write(chunk)

    if (cb) Writable.drained(this).then(cb, cb)

    return result
  }

  end (chunk, encoding, cb) {
    if (typeof chunk === 'function') {
      cb = chunk
      chunk = null
    } else if (typeof encoding === 'function') {
      cb = encoding
      encoding = null
    }

    if (typeof chunk === 'string') {
      chunk = Buffer.from(chunk, encoding || defaultEncoding)
    }

    const result = super.end(chunk)

    if (cb) this.once('end', cb)

    return result
  }
}

exports.Duplex = class Duplex extends stream.Duplex {
  constructor (opts = {}) {
    super(opts)

    if (this._construct) this._open = this._construct

    if (this._read !== stream.Readable.prototype._read) {
      this._read = read.bind(this, this._read)
    }

    if (this._writev !== stream.Duplex.prototype._writev) {
      this._writev = writev.bind(this, this._writev)
    }

    if (this._write !== stream.Duplex.prototype._write) {
      this._write = write.bind(this, this._write)
    }

    if (this._destroy !== stream.Stream.prototype._destroy) {
      this._destroy = destroy.bind(this, this._destroy)
    }
  }

  push (chunk, encoding) {
    if (typeof chunk === 'string') {
      chunk = Buffer.from(chunk, encoding || defaultEncoding)
    }

    return super.push(chunk)
  }

  unshift (chunk, encoding) {
    if (typeof chunk === 'string') {
      chunk = Buffer.from(chunk, encoding || defaultEncoding)
    }

    super.unshift(chunk)
  }

  write (chunk, encoding, cb) {
    if (typeof encoding === 'function') {
      cb = encoding
      encoding = null
    }

    if (typeof chunk === 'string') {
      chunk = Buffer.from(chunk, encoding || defaultEncoding)
    }

    const result = super.write(chunk)

    if (cb) Writable.drained(this).then(cb, cb)

    return result
  }

  end (chunk, encoding, cb) {
    if (typeof chunk === 'function') {
      cb = chunk
      chunk = null
    } else if (typeof encoding === 'function') {
      cb = encoding
      encoding = null
    }

    if (typeof chunk === 'string') {
      chunk = Buffer.from(chunk, encoding || defaultEncoding)
    }

    const result = super.end(chunk)

    if (cb) this.once('end', cb)

    return result
  }
}

exports.Transform = class Transform extends stream.Transform {
  constructor (opts = {}) {
    super(opts)

    if (this._transform !== stream.Transform.prototype._transform) {
      this._transform = transform.bind(this, this._transform)
    }
  }

  push (chunk, encoding) {
    if (typeof chunk === 'string') {
      chunk = Buffer.from(chunk, encoding || defaultEncoding)
    }

    return super.push(chunk)
  }

  unshift (chunk, encoding) {
    if (typeof chunk === 'string') {
      chunk = Buffer.from(chunk, encoding || defaultEncoding)
    }

    super.unshift(chunk)
  }

  write (chunk, encoding, cb) {
    if (typeof encoding === 'function') {
      cb = encoding
      encoding = null
    }

    if (typeof chunk === 'string') {
      chunk = Buffer.from(chunk, encoding || defaultEncoding)
    }

    const result = super.write(chunk)

    if (cb) Writable.drained(this).then(cb, cb)

    return result
  }

  end (chunk, encoding, cb) {
    if (typeof chunk === 'function') {
      cb = chunk
      chunk = null
    } else if (typeof encoding === 'function') {
      cb = encoding
      encoding = null
    }

    if (typeof chunk === 'string') {
      chunk = Buffer.from(chunk, encoding || defaultEncoding)
    }

    const result = super.end(chunk)

    if (cb) this.once('end', cb)

    return result
  }
}

exports.PassThrough = class PassThrough extends exports.Transform {}

function read (read, cb) {
  read.call(this, 65536)

  cb(null)
}

function writev (writev, batch, cb) {
  writev.call(this, batch.map(chunk => ({ chunk, encoding: 'buffer' })), cb)
}

function write (write, data, cb) {
  write.call(this, data, 'buffer', cb)
}

function transform (transform, data, cb) {
  transform.call(this, data, 'buffer', cb)
}

function destroy (destroy, cb) {
  destroy.call(this, stream.getStreamError(this), cb)
}
