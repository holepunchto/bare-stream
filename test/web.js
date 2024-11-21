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
