export class Readable {}
export class Writable {}
export class Duplex {}
export class PassThrough {}
export class Transform {}

export const promises = {
  pipeline: async () => {},
  finished: async () => {},
}

export default {
  Readable,
  Writable,
  Duplex,
  PassThrough,
  Transform,
  promises,
}
