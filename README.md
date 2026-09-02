# bare-stream

Streaming data for JavaScript. The classic Node.js-style stream classes are backed by `streamx` (<https://github.com/mafintosh/streamx>) while a `node:stream/web`-compatible implementation of the WHATWG Streams Standard is also provided.

```
npm i bare-stream
```

## Usage

```js
const { Readable } = require('bare-stream')

const stream = new Readable({
  read(size) {
    // Push data, then push `null` to signal the end
    this.push('hello')
    this.push('world')
    this.push(null)
  }
})

stream.on('data', (data) => console.log(data))
```

## API

See the [`bare-stream` reference](https://docs.pears.com/reference/bare/modules/bare-stream).

## License

Apache-2.0
