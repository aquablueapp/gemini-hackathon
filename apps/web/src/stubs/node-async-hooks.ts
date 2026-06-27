/**
 * Stub for `node:async_hooks` when 被 alias 替换（client + server 共用）。
 * - run() 必须执行 callback 并返回其返回值，否则 attachResponseHeaders 会收到 undefined。
 * - getStore() 必须在 callback 及其 async 延续内返回「当前实例」的 store；
 *   框架有两个实例（event-storage 与 start-storage-context），内层 run() 会覆盖单一 currentStore，
 *   导致 getRequest() 拿到错误 store，报 "Cannot read properties of undefined (reading 'req')"。
 * 因此按实例维护栈：每个 run() 入栈 (instance, store)，出栈在 callback 返回或 Promise.finally；
 * getStore() 返回栈顶中与当前实例匹配的 store。
 */
interface StackEntry { instance: AsyncLocalStorage<unknown>, store: unknown }

const storeStack: StackEntry[] = []

export class AsyncLocalStorage<T> {
  run<R>(store: T, callback: () => R): R {
    const entry: StackEntry = { instance: this as AsyncLocalStorage<unknown>, store }
    storeStack.push(entry)
    try {
      const result = callback()
      const resultObj = result as { then?: unknown, finally?: (fn: () => void) => void }
      if (resultObj && typeof resultObj.then === 'function') {
        resultObj.finally?.(() => {
          if (storeStack[storeStack.length - 1] === entry)
            storeStack.pop()
        })
      }
      else {
        storeStack.pop()
      }
      return result
    }
    catch (e) {
      if (storeStack[storeStack.length - 1] === entry)
        storeStack.pop()
      throw e
    }
  }

  getStore(): T | undefined {
    for (let i = storeStack.length - 1; i >= 0; i--) {
      if (storeStack[i].instance === this)
        return storeStack[i].store as T
    }
    return undefined
  }
}

export default { AsyncLocalStorage }
