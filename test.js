const test = require('brittle')
const { Writable } = require('.')

test('writable', (t) => {
  t.plan(2)

  const stream = new Writable({
    write (data, encoding, cb) {
      t.alike(data, Buffer.from('hello'))
      t.is(encoding, 'buffer')

      cb(null)
    }
  })

  stream.write('hello')
})

test('writable, batched', (t) => {
  t.plan(1)

  const stream = new Writable({
    writev (chunks, cb) {
      t.alike(chunks, [{ chunk: Buffer.from('hello'), encoding: 'buffer' }])

      cb(null)
    }
  })

  stream.write('hello')
})
