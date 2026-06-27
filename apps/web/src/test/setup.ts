import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// 每个测试用例结束后自动清理 DOM
afterEach(() => {
  cleanup()
})

// -----------------------------------------------------------------------------
// Mock Browser APIs not supported by happy-dom or required by React Aria / HeroUI
// -----------------------------------------------------------------------------

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.IntersectionObserver = IntersectionObserverMock as any

// Mock window.matchMedia (used by Tailwind/HeroUI for responsive/theme checks)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock PointerEvent (crucial for React Aria onPress events)
if (!globalThis.PointerEvent) {
  class PointerEventMock extends MouseEvent {
    pointerId: number
    pointerType: string
    isPrimary: boolean

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params)
      this.pointerId = params.pointerId ?? 1
      this.pointerType = params.pointerType ?? 'mouse'
      this.isPrimary = params.isPrimary ?? true
    }
  }
  globalThis.PointerEvent = PointerEventMock as any
}
