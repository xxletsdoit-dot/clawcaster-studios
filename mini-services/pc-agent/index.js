'use strict'

const WebSocket = require('ws')
const os = require('os')
const { exec } = require('child_process')
const { promisify } = require('util')

const { takeScreenshot } = require('./modules/screenshot')
const { handleInput } = require('./modules/input')
const { handleFiles } = require('./modules/files')
const { handleProcesses } = require('./modules/processes')

const execAsync = promisify(exec)

const RELAY_URL = process.env.RELAY_URL || 'ws://localhost:3001'
const TOKEN = process.env.REMOTE_TOKEN || 'changeme-please'
const RECONNECT_MS = parseInt(process.env.RECONNECT_MS || '5000', 10)

let ws = null
let reconnectTimer = null

// ─── Connection ──────────────────────────────────────────────────────────────

function connect() {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) return
  console.log(`[${ts()}] Connecting to relay at ${RELAY_URL} ...`)
  ws = new WebSocket(RELAY_URL)

  ws.on('open', () => {
    console.log(`[${ts()}] Connected — authenticating`)
    send({ type: 'auth', token: TOKEN, role: 'agent' })
  })

  ws.on('message', (raw) => {
    let msg
    try { msg = JSON.parse(raw.toString()) } catch { return }

    if (msg.type === 'auth_ok') {
      console.log(`[${ts()}] Authenticated. Sending system info.`)
      sendInfo()
      return
    }
    if (msg.type === 'error') {
      console.error(`[${ts()}] Relay error: ${msg.message}`)
      return
    }
    if (msg.type === 'cmd') {
      handleCommand(msg).catch(err => {
        console.error(`[${ts()}] Unhandled error in ${msg.action}:`, err.message)
      })
    }
  })

  ws.on('close', (code) => {
    console.log(`[${ts()}] Disconnected (${code}). Reconnecting in ${RECONNECT_MS}ms ...`)
    ws = null
    scheduleReconnect()
  })

  ws.on('error', (err) => {
    console.error(`[${ts()}] WS error: ${err.message}`)
    ws?.terminate()
  })
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(connect, RECONNECT_MS)
}

function send(msg) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

function sendResult(id, action, data) {
  send({ type: 'result', id, action, ...data })
}

function sendError(id, message) {
  send({ type: 'error', id, message })
}

function getScreenSize() {
  try {
    return require('robotjs').getScreenSize()
  } catch {
    return { width: 1920, height: 1080 }
  }
}

function sendInfo() {
  const screen = getScreenSize()
  send({
    type: 'info',
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    username: os.userInfo().username,
    screenWidth: screen.width,
    screenHeight: screen.height
  })
}

// ─── Command dispatcher ───────────────────────────────────────────────────────

async function handleCommand(msg) {
  const { id, action } = msg
  console.log(`[${ts()}] CMD ${action} (${id?.slice(0, 8)})`)

  try {
    switch (action) {
      case 'screenshot': {
        const result = await takeScreenshot()
        sendResult(id, 'screenshot', result)
        break
      }

      case 'mousemove':
      case 'click':
      case 'dblclick':
      case 'mousedown':
      case 'mouseup':
      case 'scroll':
      case 'keypress':
      case 'keycombo':
      case 'type': {
        const result = await handleInput(action, msg)
        sendResult(id, action, result)
        break
      }

      case 'listdir':
      case 'readfile':
      case 'writefile':
      case 'deletefile':
      case 'makedir':
      case 'movefile':
      case 'copyfile': {
        const result = await handleFiles(action, msg)
        sendResult(id, action, result)
        break
      }

      case 'listprocesses':
      case 'killprocess': {
        const result = await handleProcesses(action, msg)
        sendResult(id, action, result)
        break
      }

      case 'runcommand': {
        const { command, cwd } = msg
        try {
          const { stdout, stderr } = await execAsync(command, {
            cwd: cwd || os.homedir(),
            timeout: 30000,
            maxBuffer: 10 * 1024 * 1024
          })
          sendResult(id, 'runcommand', { stdout, stderr, exitCode: 0 })
        } catch (err) {
          sendResult(id, 'runcommand', {
            stdout: err.stdout ?? '',
            stderr: err.stderr ?? err.message,
            exitCode: err.code ?? 1
          })
        }
        break
      }

      default:
        sendError(id, `Unknown action: ${action}`)
    }
  } catch (err) {
    console.error(`[${ts()}] Error in ${action}:`, err.message)
    sendError(id, err.message)
  }
}

function ts() {
  return new Date().toISOString().slice(11, 19)
}

// ─── Start ────────────────────────────────────────────────────────────────────

console.log('ClawCaster PC Agent starting...')
console.log(`Platform: ${os.platform()} | Hostname: ${os.hostname()}`)
connect()

process.on('SIGINT', () => { ws?.close(); process.exit(0) })
process.on('SIGTERM', () => { ws?.close(); process.exit(0) })
