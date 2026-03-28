'use strict'

const { WebSocketServer, WebSocket } = require('ws')
const http = require('http')
const crypto = require('crypto')

const PORT = parseInt(process.env.PORT || '3001', 10)
const AUTH_TOKEN = process.env.REMOTE_TOKEN || 'changeme-please'

if (AUTH_TOKEN === 'changeme-please') {
  console.warn('⚠️  Using default token! Set REMOTE_TOKEN in .env for security.')
}

/** @type {WebSocket | null} */
let agentWs = null
let agentInfo = null

/** @type {Map<string, WebSocket>} clientId → ws */
const browserMap = new Map()

/** @type {Map<string, WebSocket>} requestId → browser ws */
const pendingRequests = new Map()

function broadcastToBrowsers(msg) {
  const data = JSON.stringify(msg)
  for (const ws of browserMap.values()) {
    if (ws.readyState === WebSocket.OPEN) ws.send(data)
  }
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      ok: true,
      agentConnected: agentWs !== null && agentWs.readyState === WebSocket.OPEN,
      browsers: browserMap.size,
      agentInfo
    }))
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

const wss = new WebSocketServer({ server })

wss.on('connection', (ws, req) => {
  const clientId = crypto.randomUUID()
  const ip = req.socket.remoteAddress
  let role = null

  console.log(`[${ts()}] New connection from ${ip} (${clientId.slice(0, 8)})`)

  // Close unauthenticated connections after 10s
  const authTimeout = setTimeout(() => {
    if (!role) {
      console.log(`[${ts()}] Auth timeout for ${clientId.slice(0, 8)}`)
      ws.close(1008, 'Auth timeout')
    }
  }, 10000)

  ws.on('message', (raw) => {
    let msg
    try { msg = JSON.parse(raw.toString()) } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
      return
    }

    if (!role) {
      if (msg.type !== 'auth') {
        ws.send(JSON.stringify({ type: 'error', message: 'Expected auth first' }))
        ws.close()
        return
      }
      if (msg.token !== AUTH_TOKEN) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }))
        ws.close()
        return
      }

      role = msg.role === 'agent' ? 'agent' : 'browser'

      if (role === 'agent') {
        if (agentWs?.readyState === WebSocket.OPEN) {
          agentWs.close(1000, 'Replaced by new agent')
        }
        agentWs = ws
        ws.send(JSON.stringify({ type: 'auth_ok', role: 'agent' }))
        broadcastToBrowsers({ type: 'agent_status', connected: true })
        console.log(`[${ts()}] Agent authenticated`)
      } else {
        browserMap.set(clientId, ws)
        ws.send(JSON.stringify({
          type: 'auth_ok',
          role: 'browser',
          agentConnected: agentWs?.readyState === WebSocket.OPEN,
          agentInfo
        }))
        console.log(`[${ts()}] Browser authenticated`)
      }
      return
    }

    if (role === 'browser') {
      if (msg.type !== 'cmd') return
      if (!agentWs || agentWs.readyState !== WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'error', id: msg.id, message: 'Agent not connected' }))
        return
      }
      if (msg.id) pendingRequests.set(msg.id, ws)
      agentWs.send(JSON.stringify(msg))
      return
    }

    if (role === 'agent') {
      if (msg.type === 'info') {
        agentInfo = msg
        broadcastToBrowsers({ type: 'agent_info', ...msg })
        return
      }
      // Route result back to requesting browser
      if (msg.id && pendingRequests.has(msg.id)) {
        const bws = pendingRequests.get(msg.id)
        pendingRequests.delete(msg.id)
        if (bws?.readyState === WebSocket.OPEN) bws.send(JSON.stringify(msg))
      } else {
        broadcastToBrowsers(msg)
      }
    }
  })

  ws.on('close', (code, reason) => {
    clearTimeout(authTimeout)
    console.log(`[${ts()}] Closed ${clientId.slice(0, 8)} (${code})`)

    if (role === 'agent' && agentWs === ws) {
      agentWs = null
      agentInfo = null
      broadcastToBrowsers({ type: 'agent_status', connected: false })
    } else if (role === 'browser') {
      browserMap.delete(clientId)
      for (const [id, bws] of pendingRequests) {
        if (bws === ws) pendingRequests.delete(id)
      }
    }
  })

  ws.on('error', (err) => {
    console.error(`[${ts()}] Error ${clientId.slice(0, 8)}:`, err.message)
  })
})

function ts() {
  return new Date().toISOString().slice(11, 19)
}

server.listen(PORT, () => {
  console.log(`🔌 Relay server on ws://localhost:${PORT}`)
  console.log(`📡 Health: http://localhost:${PORT}/health`)
})

process.on('SIGTERM', () => { server.close(); process.exit(0) })
process.on('SIGINT', () => { server.close(); process.exit(0) })
