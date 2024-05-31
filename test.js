const test = require('brittle')
const { Readable, Writable, Duplex, Transform } = require('.')

test('readable', (t) => {
  t.plan(3)

  const stream = new Readable({
    read (size) {
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
    read () {
      if (i++ === 3) this.push(null)
      else setTimeout(() => this.push(i.toString()), 10)
    }
  })

  const read = []

  stream
    .on('data', (data) => read.push(data.toString()))
    .on('end', () => t.alike(read, ['1', '2', '3']))
})

test('readable, destroy', (t) => {
  t.plan(2)

  const stream = new Readable({
    destroy (err, cb) {
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
    destroy (err, cb) {
      t.is(this, stream)
      t.is(err.message, 'boom')

      cb(null)
    }
  })

  stream
    .on('error', (err) => t.is(err.message, 'boom'))
    .destroy(new Error('boom'))
})

test('readable, encoding', (t) => {
  t.plan(3)

  const stream = new Readable({
    read (size) {
      t.is(this, stream)
      t.is(typeof size, 'number')

      this.push(Buffer.from('hello'))
      this.push(null)
    }
  })

  stream.setEncoding('utf8')

  stream.on('data', (data) => t.is(data, 'hello'))
})

test('writable', (t) => {
  t.plan(3)

  const stream = new Writable({
    write (data, encoding, cb) {
      t.is(this, stream)
      t.alike(data, Buffer.from('hello'))
      t.is(encoding, 'buffer')

      cb(null)
    }
  })

  stream.write('hello')
})

test('writable, batched', (t) => {
  t.plan(2)

  const stream = new Writable({
    writev (chunks, cb) {
      t.is(this, stream)
      t.alike(chunks, [{ chunk: Buffer.from('hello'), encoding: 'buffer' }])

      cb(null)
    }
  })

  stream.write('hello')
})

test('writable, destroy', (t) => {
  t.plan(2)

  const stream = new Writable({
    destroy (err, cb) {
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
    destroy (err, cb) {
      t.is(this, stream)
      t.is(err.message, 'boom')

      cb(null)
    }
  })

  stream
    .on('error', (err) => t.is(err.message, 'boom'))
    .destroy(new Error('boom'))
})

test('duplex', (t) => {
  t.plan(6)

  const stream = new Duplex({
    read (size) {
      t.is(this, stream)
      t.is(typeof size, 'number')

      this.push('hello')
      this.push(null)
    },

    write (data, encoding, cb) {
      t.is(this, stream)
      t.alike(data, Buffer.from('hello'))
      t.is(encoding, 'buffer')

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
    writev (chunks, cb) {
      t.is(this, stream)
      t.alike(chunks, [{ chunk: Buffer.from('hello'), encoding: 'buffer' }])

      cb(null)
    }
  })

  stream.write('hello')
})

test('duplex, destroy', (t) => {
  t.plan(2)

  const stream = new Duplex({
    destroy (err, cb) {
      t.is(this, stream)
      t.is(err, null)

      cb(null)
    }
  })

  stream.destroy()
})

test('duplex, encoding', (t) => {
  t.plan(3)

  const stream = new Duplex({
    read (size) {
      t.is(this, stream)
      t.is(typeof size, 'number')

      this.push(Buffer.from('hello'))
      this.push(null)
    }
  })

  stream.setEncoding('utf8')

  stream.on('data', (data) => t.is(data, 'hello'))
})

test('duplex, destroy with error', (t) => {
  t.plan(3)

  const stream = new Duplex({
    destroy (err, cb) {
      t.is(this, stream)
      t.is(err.message, 'boom')

      cb(null)
    }
  })

  stream
    .on('error', (err) => t.is(err.message, 'boom'))
    .destroy(new Error('boom'))
})

test('transform', (t) => {
  t.plan(3)

  const stream = new Transform({
    transform (data, encoding, cb) {
      t.is(this, stream)
      t.alike(data, Buffer.from('hello'))
      t.is(encoding, 'buffer')

      cb(null)
    }
  })

  stream.write('hello')
})

test('transform, encoding', (t) => {
  t.plan(4)

  const stream = new Transform({
    transform (data, encoding, cb) {
      t.is(this, stream)
      t.alike(data, Buffer.from('hello'))
      t.is(encoding, 'buffer')

      this.push(data)

      cb(null)
    }
  })

  stream.setEncoding('utf8')

  stream
    .on('data', (data) => t.is(data, 'hello'))
    .write('hello')
})
