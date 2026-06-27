import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export interface SandboxOptions {
  appId: string
  scriptContent: string
  dependencies: string[]
  timeoutMs?: number
  envVars?: Record<string, string>
  onLog?: (line: string, type: 'stdout' | 'stderr') => void
}

export interface SandboxResult {
  exitCode: number | null
  error?: string
}

/**
 * Runs a python script inside a sandboxed workspace directory using `uv run`.
 * Wraps stdout/stderr in a line-buffered callback and resolves on child process exit.
 */
export async function runSandboxScript(options: SandboxOptions): Promise<SandboxResult> {
  const { appId, scriptContent, dependencies, timeoutMs = 120000, envVars = {}, onLog } = options

  // Use system temp directory + aquablue workspace + app isolation
  const sandboxRoot = path.join(os.tmpdir(), 'aquablue-sandbox', 'default_user', appId)
  fs.mkdirSync(sandboxRoot, { recursive: true })

  // Write Python script with PEP 723 inline dependency metadata
  let formattedScript = ''
  if (dependencies && dependencies.length > 0) {
    formattedScript += '# /// script\n'
    formattedScript += '# requires-python = ">=3.11"\n'
    formattedScript += '# dependencies = [\n'
    for (const dep of dependencies) {
      formattedScript += `#     "${dep}",\n`
    }
    formattedScript += '# ]\n'
    formattedScript += '# ///\n\n'
  }
  formattedScript += scriptContent

  const scriptPath = path.join(sandboxRoot, 'main.py')
  fs.writeFileSync(scriptPath, formattedScript, 'utf8')

  // Spawn uv run subprocess with shared memory limits and pre-installed packages reuse
  const child = spawn('uv', ['run', 'main.py'], {
    cwd: sandboxRoot,
    detached: true, // Detach process to run in its own process group
    env: {
      ...process.env,
      ...envVars,
      UV_CACHE_DIR: '/tmp/uv-cache',
      UV_SYSTEM_PYTHON: '1',
      PYTHONUNBUFFERED: '1',
    },
  })

  // Helper to handle line buffering
  const pipeStream = (stream: NodeJS.ReadableStream, type: 'stdout' | 'stderr') => {
    let buffer = ''
    stream.on('data', (chunk) => {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      // The last element is either empty (if ended with \n) or incomplete line fragment
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (onLog) {
          onLog(line, type)
        }
      }
    })
    stream.on('end', () => {
      if (buffer && onLog) {
        onLog(buffer, type)
      }
    })
  }

  if (child.stdout)
    pipeStream(child.stdout, 'stdout')
  if (child.stderr)
    pipeStream(child.stderr, 'stderr')

  return new Promise((resolve) => {
    let killedByTimeout = false

    const timer = setTimeout(() => {
      killedByTimeout = true
      if (child.pid) {
        try {
          // Send SIGKILL to the negative PID, which targets the entire process group
          process.kill(-child.pid, 'SIGKILL')
        }
        catch {
          // Process might have exited just before we sent kill
        }
      }
    }, timeoutMs)

    child.on('close', (code) => {
      clearTimeout(timer)
      if (killedByTimeout) {
        resolve({ exitCode: null, error: `Execution timed out after ${timeoutMs}ms` })
      }
      else {
        resolve({ exitCode: code })
      }
    })

    child.on('error', (err) => {
      clearTimeout(timer)
      resolve({ exitCode: null, error: err.message })
    })
  })
}
