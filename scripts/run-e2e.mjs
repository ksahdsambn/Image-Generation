import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const rootDir = fileURLToPath(new URL('../', import.meta.url))
const viteBin = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const playwrightCli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url))
const defaultServerUrl = 'http://127.0.0.1:5173'
const serverUrl = process.env.PLAYWRIGHT_BASE_URL ?? defaultServerUrl
const shouldStartLocalServer = serverUrl === defaultServerUrl

const server = shouldStartLocalServer
  ? spawn(process.execPath, [viteBin, '--host', '127.0.0.1'], {
      cwd: rootDir,
      stdio: 'ignore',
    })
  : null

async function waitForServer() {
  const startedAt = Date.now()
  while (Date.now() - startedAt < 30000) {
    try {
      const response = await fetch(serverUrl)
      if (response.ok) return
    } catch {
      // Keep polling until Vite is ready or the timeout is reached.
    }
    await delay(500)
  }
  throw new Error(`Timed out waiting for ${serverUrl}`)
}

function stopServer() {
  if (server && !server.killed) {
    server.kill()
  }
}

try {
  await waitForServer()
  const args = ['test', '--reporter=line', ...process.argv.slice(2)]
  const result = spawn(process.execPath, [playwrightCli, ...args], {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      PLAYWRIGHT_SKIP_WEBSERVER: '1',
    },
  })

  const exitCode = await new Promise((resolve) => {
    result.on('exit', (code) => resolve(code ?? 1))
    result.on('error', () => resolve(1))
  })

  stopServer()
  process.exit(exitCode)
} catch (error) {
  stopServer()
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
