const test = require('brittle')
const {
  ReadableStream,
  CountQueuingStrategy,
  ByteLengthQueuingStrategy,
  WritableStream,
  WritableStreamDefaultController
} = require('../web')

test('web, readable', async (t) => {
  t.plan(2)

  const read = []

  const stream = new ReadableStream({
    start(controller) {
      t.is(controller.desiredSize, 1)

      controller.enqueue(1)
      controller.enqueue(2)
      controller.enqueue(3)
      controller.close()
    }
  })

  for await (const value of stream) {
    read.push(value)
  }

  t.alike(read, [1, 2, 3])
})

test('web, readable, error', async (t) => {
  t.plan(1)

  const stream = new ReadableStream({
    start(controller) {
      controller.error('boom!')
    }
  })

  t.exception(async () => {
    for await (const value of stream) {
    }
  }, 'boom!')
})

test('web, readable, cancel', async (t) => {
  t.plan(2)

  const stream = new ReadableStream({
    cancel(reason) {
      t.is(reason, 'reason')
    }
  })

  await t.execution(stream.cancel('reason'))
})

test('web, readable, reader.cancel', async (t) => {
  t.plan(2)

  const stream = new ReadableStream({
    cancel(reason) {
      t.is(reason, 'reason')
    }
  })

  const reader = stream.getReader()

  await t.execution(reader.cancel('reason'))
})

test('web, readable, from', async (t) => {
  t.plan(2)

  async function* asyncIterator() {
    yield 1
    yield 2
    yield 3
  }

  const stream = ReadableStream.from(asyncIterator())

  t.ok(stream instanceof ReadableStream)

  const read = []

  for await (const value of stream) {
    read.push(value)
  }

  t.alike(read, [1, 2, 3])
})

test('web, readable, reader', async (t) => {
  t.plan(7)

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(1)
      controller.enqueue(2)
      controller.close()
    }
  })

  const reader = stream.getReader()

  t.exception.all(() => stream.getReader())
  await t.exception.all(stream.cancel())

  t.alike(await reader.read(), { value: 1, done: false })
  t.alike(await reader.read(), { value: 2, done: false })
  t.alike(await reader.read(), { value: undefined, done: true })

  t.ok(reader.closed)
  await t.execution(reader.closed, 'reader closed')
})

test('web, readable, pull', async (t) => {
  t.plan(1)

  let count = 0

  const stream = new ReadableStream({
    pull(controller) {
      count !== 3 ? controller.enqueue(++count) : controller.close()
    }
  })

  const read = []
  for await (const value of stream) read.push(value)

  t.alike(read, [1, 2, 3])
})

test('web, readable, locked', async (t) => {
  t.plan(3)

  const stream = new ReadableStream()

  const reader = stream.getReader()

  t.is(stream.locked, true)

  reader.releaseLock()

  await t.exception.all(reader.closed)

  t.is(stream.locked, false)
})

test('web, readable, tee', async (t) => {
  t.plan(4)

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue('foo')
      controller.close()
    }
  })

  const [branchA, branchB] = stream.tee()

  const aReader = branchA.getReader()
  const bReader = branchB.getReader()

  t.alike(await aReader.read(), { value: 'foo', done: false })
  t.alike(await bReader.read(), { value: 'foo', done: false })

  t.alike(await aReader.read(), { value: undefined, done: true })
  t.alike(await bReader.read(), { value: undefined, done: true })
})

test('web, readable, only trigger pull after start is finished', async (t) => {
  t.plan(1)

  let foo

  const stream = new ReadableStream({
    async start(controller) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      foo = 42
    },
    pull(controller) {
      t.is(foo, 42)
      controller.close()
    }
  })

  await stream.getReader().read()
})

test('web, readable, count queuing strategy', async (t) => {
  t.plan(8)

  let loop = 0
  let reader

  const stream = new ReadableStream(
    {
      start(controller) {
        t.is(controller.desiredSize, 4)
      },
      async pull(controller) {
        if (loop === 0) t.is(controller.desiredSize, 4)
        if (loop === 1) t.is(controller.desiredSize, 4)

        if (loop === 2) {
          t.is(controller.desiredSize, 3)
          await reader.read()
          t.is(controller.desiredSize, 4)
        }

        if (loop === 3) t.is(controller.desiredSize, 3)
        if (loop === 4) t.is(controller.desiredSize, 2)
        if (loop === 5) t.is(controller.desiredSize, 1)
        if (loop === 6) t.fail()

        controller.enqueue(loop++)
      }
    },
    new CountQueuingStrategy({ highWaterMark: 4 })
  )

  reader = stream.getReader()
  reader.read()
})

test('web, readable, byte length queuing strategy', async (t) => {
  t.plan(8)

  let loop = 0
  let reader

  const stream = new ReadableStream(
    {
      start(controller) {
        t.is(controller.desiredSize, 20)
      },
      async pull(controller) {
        if (loop === 0) t.is(controller.desiredSize, 20)
        if (loop === 1) t.is(controller.desiredSize, 20)

        if (loop === 2) {
          t.is(controller.desiredSize, 15)
          await reader.read()
          t.is(controller.desiredSize, 20)
        }

        if (loop === 3) t.is(controller.desiredSize, 15)
        if (loop === 4) t.is(controller.desiredSize, 10)
        if (loop === 5) t.is(controller.desiredSize, 5)
        if (loop === 6) t.fail()

        loop++

        controller.enqueue(Buffer.from('hello'))
      }
    },
    new ByteLengthQueuingStrategy({ highWaterMark: 20 })
  )

  reader = stream.getReader()
  reader.read()
})

test('web, readable, custom high water mark', async (t) => {
  t.plan(8)

  let loop = 0
  let reader

  const stream = new ReadableStream(
    {
      start(controller) {
        t.is(controller.desiredSize, 4)
      },
      async pull(controller) {
        if (loop === 0) t.is(controller.desiredSize, 4)
        if (loop === 1) t.is(controller.desiredSize, 4)

        if (loop === 2) {
          t.is(controller.desiredSize, 3)
          await reader.read()
          t.is(controller.desiredSize, 4)
        }

        if (loop === 3) t.is(controller.desiredSize, 3)
        if (loop === 4) t.is(controller.desiredSize, 2)
        if (loop === 5) t.is(controller.desiredSize, 1)
        if (loop === 6) t.fail()

        controller.enqueue(loop++)
      }
    },
    { highWaterMark: 4 }
  )

  reader = stream.getReader()
  reader.read()
})

test('web, readable, custom size function', async (t) => {
  t.plan(8)

  let loop = 0
  let reader

  const stream = new ReadableStream(
    {
      start(controller) {
        t.is(controller.desiredSize, 20)
      },
      async pull(controller) {
        if (loop === 0) t.is(controller.desiredSize, 20)
        if (loop === 1) t.is(controller.desiredSize, 20)

        if (loop === 2) {
          t.is(controller.desiredSize, 15)
          await reader.read()
          t.is(controller.desiredSize, 20)
        }

        if (loop === 3) t.is(controller.desiredSize, 15)
        if (loop === 4) t.is(controller.desiredSize, 10)
        if (loop === 5) t.is(controller.desiredSize, 5)
        if (loop === 6) t.fail()

        loop++

        controller.enqueue(Buffer.from('hello'))
      }
    },
    { highWaterMark: 20, size: (e) => Buffer.from(e).byteLength }
  )

  reader = stream.getReader()
  reader.read()
})

test('web, writable stream', async (t) => {
  t.plan(11)

  const stream = new WritableStream({
    start(controller) {
      t.ok(controller instanceof WritableStreamDefaultController)
    },
    write(chunk, controller) {
      t.is(chunk, 'foo')
      t.ok(controller instanceof WritableStreamDefaultController)
    },
    close() {
      t.pass('closed callback')
    }
  })

  const writer = stream.getWriter()

  t.exception.all(() => stream.getWriter())
  await t.exception.all(stream.abort())
  await t.exception.all(stream.close())

  t.is(writer.desiredSize, 1)

  await writer.write('foo')

  await t.execution(writer.close(), 'writer closed')

  t.ok(writer.closed)
  await t.execution(writer.closed, 'writer closed getter')
})

test('web, writable, error', async (t) => {
  t.plan(1)

  const stream = new WritableStream({
    start(controller) {
      controller.error('boom!')
    },
    abort(reason) {
      // t.fail()
    }
  })

  const writer = stream.getWriter()

  await t.exception(writer.write('foo'), /boom!/)
})

test('web, writable, close', async (t) => {
  t.plan(1)

  const stream = new WritableStream()

  await t.execution(stream.close())
})

test('web, writable, abort', async (t) => {
  t.plan(2)

  const stream = new WritableStream({
    abort(reason) {
      t.is(reason, 'reason')
    }
  })

  await t.execution(stream.abort('reason'))
})

test('web, writable, writer.abort', async (t) => {
  t.plan(2)

  const stream = new WritableStream({
    abort(reason) {
      t.is(reason, 'reason')
    }
  })

  const writer = stream.getWriter()

  await t.execution(writer.abort('reason'))
})

test('web, writable, locked', async (t) => {
  t.plan(3)

  const stream = new WritableStream()

  const writer = stream.getWriter()

  t.is(stream.locked, true)

  writer.releaseLock()

  await t.exception.all(writer.closed)

  t.is(stream.locked, false)
})

test('web, writable, ready', async (t) => {
  t.plan(3)

  const stream = new WritableStream()

  const writer = stream.getWriter()

  t.ok(writer.ready)
  await t.execution(writer.ready)

  writer.abort()

  await t.exception(writer.ready)
})

test('web, readable.pipeTo(writable)', async (t) => {
  t.plan(1)

  const written = []

  const readable = new ReadableStream({
    start(controller) {
      controller.enqueue(1)
      controller.enqueue(2)
      controller.enqueue(3)
      controller.close()
    }
  })

  const writable = new WritableStream({
    write(chunk) {
      written.push(chunk)
    }
  })

  await readable.pipeTo(writable)

  t.alike(written, [1, 2, 3])
})
