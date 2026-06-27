import { describe, expect, it } from 'vitest'
import { runSandboxScript } from './sandbox-runner'

describe('sandbox Subprocess Runner (TDD)', () => {
  it('should execute a basic Python script and collect stdout', async () => {
    const scriptContent = `
print("line 1 from sandbox")
print("line 2 from sandbox")
`
    const logs: { line: string, type: 'stdout' | 'stderr' }[] = []

    const result = await runSandboxScript({
      appId: 'test-app-basic',
      scriptContent,
      dependencies: [],
      onLog: (line, type) => {
        logs.push({ line, type })
      },
    })

    expect(result.exitCode).toBe(0)
    expect(logs.map(l => l.line.trim())).toContain('line 1 from sandbox')
    expect(logs.map(l => l.line.trim())).toContain('line 2 from sandbox')
    expect(logs.every(l => l.type === 'stdout')).toBe(true)
  })

  it('should capture stderr when python script fails', async () => {
    const scriptContent = `
import sys
print("error output", file=sys.stderr)
sys.exit(5)
`
    const logs: { line: string, type: 'stdout' | 'stderr' }[] = []

    const result = await runSandboxScript({
      appId: 'test-app-error',
      scriptContent,
      dependencies: [],
      onLog: (line, type) => {
        logs.push({ line, type })
      },
    })

    expect(result.exitCode).toBe(5)
    expect(logs.map(l => l.line.trim())).toContain('error output')
    expect(logs.some(l => l.type === 'stderr')).toBe(true)
  })

  it('should enforce timeout limits and terminate hanging processes', async () => {
    const scriptContent = `
import time
print("started sleep")
time.sleep(10)
print("finished sleep")
`
    const logs: { line: string, type: 'stdout' | 'stderr' }[] = []

    const start = Date.now()
    const result = await runSandboxScript({
      appId: 'test-app-timeout',
      scriptContent,
      dependencies: [],
      timeoutMs: 1000, // Enforce a 1 second timeout
      onLog: (line, type) => {
        logs.push({ line, type })
      },
    })
    const duration = Date.now() - start

    // The execution duration should be close to 1 second, definitely way below 10 seconds
    expect(duration).toBeLessThan(4000)
    expect(result.exitCode).toBeNull()
    expect(result.error).toContain('timed out')
    expect(logs.map(l => l.line.trim())).toContain('started sleep')
    expect(logs.map(l => l.line.trim())).not.toContain('finished sleep')
  })
})
