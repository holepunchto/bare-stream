const test = require('brittle')
const { Writable } = require('.')

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
