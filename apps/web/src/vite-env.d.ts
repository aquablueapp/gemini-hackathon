// src/vite-env.d.ts
/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

declare module '*.css?url' {
  const url: string
  export default url
}
