const test = require('brittle')
const {
  ReadableStream,
  CountQueuingStrategy,
  ByteLengthQueuingStrategy,
  WritableStream,
  WritableStreamDefaultController
} = require('../web')

test('ReadableStream', async (t) => {
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

test('ReadableStream - error', async (t) => {
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

test('ReadableStream - cancel', async (t) => {
  t.plan(2)

  const stream = new ReadableStream({
    cancel(reason) {
      t.is(reason, 'I am bored')
    }
  })

  await t.execution(stream.cancel('I am bored'))
})

test('ReadableStream - from', async (t) => {
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

test('ReadableStream - reader', async (t) => {
  t.plan(6)

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(1)
      controller.enqueue(2)
      controller.close()
    }
  })

  const reader = stream.getReader()

  t.exception.all(() => stream.getReader(), /ReadableStream is locked/)

  t.alike(await reader.read(), { value: 1, done: false })
  t.alike(await reader.read(), { value: 2, done: false })
  t.alike(await reader.read(), { value: undefined, done: true })

  t.ok(reader.closed)
  await t.execution(reader.closed, 'reader closed')
})

test('ReadableStream - pull', async (t) => {
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

test('ReadableStream - locked', async (t) => {
  t.plan(3)

  const stream = new ReadableStream()

  const reader = stream.getReader()

  t.is(stream.locked, true)

  reader.releaseLock()

  await t.exception.all(async () => reader.closed, 'called releaseLock before stream closure')

  t.is(stream.locked, false)
})

test('ReadableStream - tee', async (t) => {
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

test('ReadableStream - only trigger pull after start is finished', async (t) => {
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

test('CountQueuingStrategy', async (t) => {
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

test('ReadableStream - custom high water mark', async (t) => {
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

test('ByteLengthQueuingStrategy', async (t) => {
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

test('ReadableStream - custom size function', async (t) => {
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

test('WritableStream - writer', async (t) => {
  t.plan(6)

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

  t.is(writer.desiredSize, 1)

  await writer.write('foo')

  await t.execution(writer.close(), 'writer closed')
})

test('WritableStream - close', async (t) => {
  t.plan(1)

  const stream = new WritableStream()

  await stream.close()

  t.pass()
})

test('WritableStream - error', async (t) => {
  t.plan(1)

  const stream = new WritableStream({
    start(controller) {
      controller.error('boom!')
    }
  })

  t.exception(() => stream.close(), 'boom!')
})

test('ReadableStream.pipeTo(WritableStream)', async (t) => {
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
