const test = require('brittle')
const { ReadableStream } = require('../web')

test('basic', async (t) => {
  t.plan(1)

  const read = []

  const stream = new ReadableStream({
    start(controller) {
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
  t.plan(1)

  const asyncIterator = (async function* () {
    yield 1
    yield 2
    yield 3
  })()

  const stream = ReadableStream.from(asyncIterator)

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
