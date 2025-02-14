const test = require('brittle')
const {
  Stream,
  Readable,
  Writable,
  Duplex,
  Transform,
  PassThrough,
  finished
} = require('..')

test('default export', (t) => {
  t.is(require('..'), Stream)
})

test('readable', (t) => {
  t.plan(3)

  const stream = new Readable({
    read(size) {
      t.is(this, stream)
      t.is(typeof size, 'number')

      this.push('hello')
      this.push(null)
    }
  })

  stream.on('data', (data) => t.alike(data, Buffer.from('hello')))
})

test('readable, async', (t) => {
  t.plan(1)

  let i = 0

  const stream = new Readable({
    read() {
      if (i++ === 3) this.push(null)
      else setTimeout(() => this.push(i.toString()), 10)
    }
  })

  const read = []

  stream
    .on('data', (data) => read.push(data.toString()))
    .on('end', () => t.alike(read, ['1', '2', '3']))
})

test('readable, callback', (t) => {
  t.plan(4)

  const stream = new Readable({
    read(size, cb) {
      t.is(this, stream)
      t.is(typeof size, 'number')
      t.is(typeof cb, 'function')

      this.push('hello')
      this.push(null)
      cb(null)
    }
  })

  stream.on('data', (data) => t.alike(data, Buffer.from('hello')))
})

test('readable, destroy', (t) => {
  t.plan(2)

  const stream = new Readable({
    destroy(err, cb) {
      t.is(this, stream)
      t.is(err, null)

      cb(null)
    }
  })

  stream.destroy()
})

test('readable, destroy with error', (t) => {
  t.plan(3)

  const stream = new Readable({
    destroy(err, cb) {
      t.is(this, stream)
      t.is(err.message, 'boom')

      cb(null)
    }
  })

  stream
    .on('error', (err) => t.is(err.message, 'boom'))
    .destroy(new Error('boom'))
})

test('readable, set encoding', (t) => {
  t.plan(3)

  const stream = new Readable({
    read(size) {
      t.is(this, stream)
      t.is(typeof size, 'number')

      this.push(Buffer.from('hello'))
      this.push(null)
    }
  })

  stream.setEncoding('utf8')

  stream.on('data', (data) => t.is(data, 'hello'))
})

test('readable, push with encoding', (t) => {
  t.plan(3)

  const stream = new Readable({
    read(size) {
      t.is(this, stream)
      t.is(typeof size, 'number')

      this.push('\xab\xcd', 'ascii')
      this.push(null)
    }
  })

  stream.on('data', (data) => t.alike(data, Buffer.from([0xab, 0xcd])))
})

test('writable', (t) => {
  t.plan(3)

  const stream = new Writable({
    write(data, encoding, cb) {
      t.is(this, stream)
      t.alike(data, Buffer.from('hello'))
      t.is(encoding, 'utf8')

      cb(null)
    }
  })

  stream.write('hello')
})

test('writable, batched', (t) => {
  t.plan(2)

  const stream = new Writable({
    writev(chunks, cb) {
      t.is(this, stream)
      t.alike(chunks, [{ chunk: Buffer.from('hello'), encoding: 'utf8' }])

      cb(null)
    }
  })

  stream.write('hello')
})

test('writable, destroy', (t) => {
  t.plan(2)

  const stream = new Writable({
    destroy(err, cb) {
      t.is(this, stream)
      t.is(err, null)

      cb(null)
    }
  })

  stream.destroy()
})

test('writable, destroy with error', (t) => {
  t.plan(3)

  const stream = new Writable({
    destroy(err, cb) {
      t.is(this, stream)
      t.is(err.message, 'boom')

      cb(null)
    }
  })

  stream
    .on('error', (err) => t.is(err.message, 'boom'))
    .destroy(new Error('boom'))
})

test('writable, write buffer', (t) => {
  t.plan(3)

  const stream = new Writable({
    write(data, encoding, cb) {
      t.is(this, stream)
      t.alike(data, Buffer.from('hello'))
      t.is(encoding, 'buffer')

      cb(null)
    }
  })

  stream.write(Buffer.from('hello'))
})

test('writable, write with encoding', (t) => {
  t.plan(3)

  const stream = new Writable({
    write(data, encoding, cb) {
      t.is(this, stream)
      t.alike(data, Buffer.from([0xab, 0xcd]))
      t.is(encoding, 'ascii')

      cb(null)
    }
  })

  stream.write('\xab\xcd', 'ascii')
})

test('writable, end', (t) => {
  t.plan(1)

  const stream = new Writable({
    write(data, encoding, cb) {
      t.fail()
    },

    final(cb) {
      t.pass()

      cb(null)
    }
  })

  stream.end()
})

test('writable, end with data', (t) => {
  t.plan(4)

  const stream = new Writable({
    write(data, encoding, cb) {
      t.is(this, stream)
      t.alike(data, Buffer.from('hello'))
      t.is(encoding, 'utf8')

      cb(null)
    },

    final(cb) {
      t.pass()

      cb(null)
    }
  })

  stream.end('hello')
})

test('duplex', (t) => {
  t.plan(6)

  const stream = new Duplex({
    read(size) {
      t.is(this, stream)
      t.is(typeof size, 'number')

      this.push('hello')
      this.push(null)
    },

    write(data, encoding, cb) {
      t.is(this, stream)
      t.alike(data, Buffer.from('hello'))
      t.is(encoding, 'utf8')

      cb(null)
    }
  })

  stream
    .on('data', (data) => t.alike(data, Buffer.from('hello')))
    .write('hello')
})

test('duplex, batched', (t) => {
  t.plan(2)

  const stream = new Duplex({
    writev(chunks, cb) {
      t.is(this, stream)
      t.alike(chunks, [{ chunk: Buffer.from('hello'), encoding: 'utf8' }])

      cb(null)
    }
  })

  stream.write('hello')
})

test('duplex, destroy', (t) => {
  t.plan(2)

  const stream = new Duplex({
    destroy(err, cb) {
      t.is(this, stream)
      t.is(err, null)

      cb(null)
    }
  })

  stream.destroy()
})

test('duplex, destroy with error', (t) => {
  t.plan(3)

  const stream = new Duplex({
    destroy(err, cb) {
      t.is(this, stream)
      t.is(err.message, 'boom')

      cb(null)
    }
  })

  stream
    .on('error', (err) => t.is(err.message, 'boom'))
    .destroy(new Error('boom'))
})

test('duplex, set encoding', (t) => {
  t.plan(3)

  const stream = new Duplex({
    read(size) {
      t.is(this, stream)
      t.is(typeof size, 'number')

      this.push(Buffer.from('hello'))
      this.push(null)
    }
  })

  stream.setEncoding('utf8')

  stream.on('data', (data) => t.is(data, 'hello'))
})

test('duplex, push with encoding', (t) => {
  t.plan(3)

  const stream = new Duplex({
    read(size) {
      t.is(this, stream)
      t.is(typeof size, 'number')

      this.push('\xab\xcd', 'ascii')
      this.push(null)
    }
  })

  stream.on('data', (data) => t.alike(data, Buffer.from([0xab, 0xcd])))
})

test('duplex, write buffer', (t) => {
  t.plan(3)

  const stream = new Duplex({
    write(data, encoding, cb) {
      t.is(this, stream)
      t.alike(data, Buffer.from('hello'))
      t.is(encoding, 'buffer')

      cb(null)
    }
  })

  stream.write(Buffer.from('hello'))
})

test('duplex, write with encoding', (t) => {
  t.plan(3)

  const stream = new Duplex({
    write(data, encoding, cb) {
      t.is(this, stream)
      t.alike(data, Buffer.from([0xab, 0xcd]))
      t.is(encoding, 'ascii')

      cb(null)
    }
  })

  stream.write('\xab\xcd', 'ascii')
})

test('transform', (t) => {
  t.plan(3)

  const stream = new Transform({
    transform(data, encoding, cb) {
      t.is(this, stream)
      t.alike(data, Buffer.from('hello'))
      t.is(encoding, 'utf8')

      cb(null)
    }
  })

  stream.write('hello')
})

test('transform, set encoding', (t) => {
  t.plan(4)

  const stream = new Transform({
    transform(data, encoding, cb) {
      t.is(this, stream)
      t.alike(data, Buffer.from('hello'))
      t.is(encoding, 'utf8')

      this.push(data)

      cb(null)
    }
  })

  stream.setEncoding('utf8')

  stream.on('data', (data) => t.is(data, 'hello')).write('hello')
})

test('transform, write buffer', (t) => {
  t.plan(3)

  const stream = new Transform({
    transform(data, encoding, cb) {
      t.is(this, stream)
      t.alike(data, Buffer.from('hello'))
      t.is(encoding, 'buffer')

      cb(null)
    }
  })

  stream.write(Buffer.from('hello'))
})

test('transform, write with encoding', (t) => {
  t.plan(3)

  const stream = new Transform({
    transform(data, encoding, cb) {
      t.is(this, stream)
      t.alike(data, Buffer.from([0xab, 0xcd]))
      t.is(encoding, 'ascii')

      cb(null)
    }
  })

  stream.write('\xab\xcd', 'ascii')
})

test('passthrough', (t) => {
  t.plan(4)

  const writable = new Writable({
    write(data, encoding, cb) {
      t.is(this, writable)
      t.alike(data, Buffer.from('hello'))
      t.is(encoding, 'buffer')
    }
  })

  const readable = new Readable({
    read(size) {
      t.is(this, readable)

      this.push('hello')
      this.push(null)
    }
  })

  const passthrough = new PassThrough()

  readable.pipe(passthrough).pipe(writable)
  readable.read()
})

test('finished, readable', (t) => {
  t.plan(1)

  const stream = new Readable({
    read(size) {
      this.push('hello')
    }
  })

  finished(stream, (err) => {
    t.absent(err)
  })

  stream.on('data', () => stream.push(null))
})

test('finished, writable', (t) => {
  t.plan(1)

  const stream = new Writable({
    write(data, encoding, cb) {
      cb(null)
    }
  })

  finished(stream, (err) => {
    t.absent(err)
  })

  stream.end('message')
})

test('finished, duplex', (t) => {
  t.plan(1)

  const stream = new Duplex({
    read(size) {
      this.push('hello')
    },
    write(data, encoding, cb) {
      cb(null)
    }
  })

  finished(stream, (err) => {
    t.absent(err)
  })

  stream.on('data', () => stream.push(null))
  stream.end('hello')
})

test('finished, duplex, incomplete writing', (t) => {
  const stream = new Duplex()

  finished(stream, () => {
    t.fail('not finished writing')
  })

  stream.on('data', () => stream.push(null))
})

test('finished, duplex, incomplete reading', (t) => {
  const stream = new Duplex()

  finished(stream, () => {
    t.fail('not finished reading')
  })

  stream.end('hello')
})

test('finished, error handling', (t) => {
  t.plan(1)

  const stream = new Readable()

  finished(stream, (err) => {
    t.is(err.message, 'boom')
  })

  stream.destroy(new Error('boom'))
})
