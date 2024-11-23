const test = require('brittle')
const {
  ReadableStream,
  CountQueuingStrategy,
  ByteLengthQueuingStrategy
} = require('../web')

test('basic', async (t) => {
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

test('error', async (t) => {
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

test('cancel', async (t) => {
  t.plan(1)

  const stream = new ReadableStream()

  await stream.cancel()

  t.pass()
})

test('from', async (t) => {
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

test('reader', async (t) => {
  t.plan(3)

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(1)
      controller.enqueue(2)
      controller.close()
    }
  })

  const reader = stream.getReader()

  t.alike(await reader.read(), { value: 1, done: false })
  t.alike(await reader.read(), { value: 2, done: false })
  t.alike(await reader.read(), { value: undefined, done: true })
})

test('pull', async (t) => {
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

test('only trigger pull after start is finished', async (t) => {
  t.plan(1)

  let foo

  new ReadableStream({
    async start(controller) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      foo = 42
    },
    pull(controller) {
      t.is(foo, 42)
      controller.close()
    }
  })
})

test('count queuing strategy', async (t) => {
  t.plan(7)

  let loop = 0

  const stream = new ReadableStream(
    {
      start(controller) {
        t.is(controller.desiredSize, 4)
      },
      async pull(controller) {
        if (loop === 0) t.is(controller.desiredSize, 4)
        if (loop === 1) t.is(controller.desiredSize, 3)

        if (loop === 2) {
          t.is(controller.desiredSize, 2)
          await stream.getReader().read()
          t.is(controller.desiredSize, 3)
        }

        if (loop === 3) t.is(controller.desiredSize, 2)
        if (loop === 4) t.is(controller.desiredSize, 1)
        if (loop === 5) t.fail()

        controller.enqueue(loop++)
      }
    },
    new CountQueuingStrategy({ highWaterMark: 4 })
  )
})

test('custom high water mark', async (t) => {
  t.plan(7)

  let loop = 0

  const stream = new ReadableStream(
    {
      start(controller) {
        t.is(controller.desiredSize, 4)
      },
      async pull(controller) {
        if (loop === 0) t.is(controller.desiredSize, 4)
        if (loop === 1) t.is(controller.desiredSize, 3)

        if (loop === 2) {
          t.is(controller.desiredSize, 2)
          await stream.getReader().read()
          t.is(controller.desiredSize, 3)
        }

        if (loop === 3) t.is(controller.desiredSize, 2)
        if (loop === 4) t.is(controller.desiredSize, 1)
        if (loop === 5) t.fail()

        controller.enqueue(loop++)
      }
    },
    { highWaterMark: 4 }
  )
})

test('byte length queuing strategy', async (t) => {
  t.plan(7)

  let loop = 0

  const stream = new ReadableStream(
    {
      start(controller) {
        t.is(controller.desiredSize, 20)
      },
      async pull(controller) {
        if (loop === 0) t.is(controller.desiredSize, 20)
        if (loop === 1) t.is(controller.desiredSize, 15)

        if (loop === 2) {
          t.is(controller.desiredSize, 10)
          await stream.getReader().read()
          t.is(controller.desiredSize, 15)
        }

        if (loop === 3) t.is(controller.desiredSize, 10)
        if (loop === 4) t.is(controller.desiredSize, 5)
        if (loop === 5) t.fail()

        loop++
        controller.enqueue(Buffer.from('hello'))
      }
    },
    new ByteLengthQueuingStrategy({ highWaterMark: 20 })
  )
})

test('custom size function', async (t) => {
  t.plan(7)

  let loop = 0

  const stream = new ReadableStream(
    {
      start(controller) {
        t.is(controller.desiredSize, 20)
      },
      async pull(controller) {
        if (loop === 0) t.is(controller.desiredSize, 20)
        if (loop === 1) t.is(controller.desiredSize, 15)

        if (loop === 2) {
          t.is(controller.desiredSize, 10)
          await stream.getReader().read()
          t.is(controller.desiredSize, 15)
        }

        if (loop === 3) t.is(controller.desiredSize, 10)
        if (loop === 4) t.is(controller.desiredSize, 5)
        if (loop === 5) t.fail()

        loop++
        controller.enqueue('hello')
      }
    },
    { highWaterMark: 20, size: (elem) => Buffer.from(elem).byteLength }
  )
})
