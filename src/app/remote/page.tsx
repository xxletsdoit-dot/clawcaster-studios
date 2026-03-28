'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Monitor, Folder, Cpu, Terminal as TerminalIcon,
  RefreshCw, Trash2, ChevronRight, Home, Settings,
  Wifi, WifiOff, Play, Square, MousePointer, X
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentInfo = {
  hostname: string
  platform: string
  arch: string
  screenWidth: number
  screenHeight: number
  username: string
}

type FileEntry = {
  name: string
  type: 'file' | 'directory' | 'symlink'
  size: number
  mtime: string | null
  path: string
}

type ProcessEntry = {
  pid: number
  command: string
  cpu: number
  mem: number
  user?: string
}

type TerminalEntry = {
  id: string
  command: string
  cwd: string
  stdout: string
  stderr: string
  exitCode: number | null
  running: boolean
}

type RelayState = 'disconnected' | 'connecting' | 'connected'

// ─── useRelay hook ────────────────────────────────────────────────────────────

function useRelay(url: string, token: string) {
  const [state, setState] = useState<RelayState>('disconnected')
  const [agentConnected, setAgentConnected] = useState(false)
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const pendingRef = useRef<Map<string, (msg: Record<string, unknown>) => void>>(new Map())

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    setState('connecting')

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token, role: 'browser' }))
    }

    ws.onmessage = ({ data }) => {
      let msg: Record<string, unknown>
      try { msg = JSON.parse(data as string) } catch { return }

      if (msg.type === 'auth_ok') {
        setState('connected')
        setAgentConnected(Boolean(msg.agentConnected))
        if (msg.agentInfo) setAgentInfo(msg.agentInfo as AgentInfo)
        return
      }
      if (msg.type === 'agent_status') {
        setAgentConnected(Boolean(msg.connected))
        if (!msg.connected) setAgentInfo(null)
        return
      }
      if (msg.type === 'agent_info') {
        setAgentInfo(msg as unknown as AgentInfo)
        return
      }

      const id = msg.id as string | undefined
      if (id && pendingRef.current.has(id)) {
        const resolve = pendingRef.current.get(id)!
        pendingRef.current.delete(id)
        resolve(msg)
      }
    }

    ws.onclose = () => {
      setState('disconnected')
      setAgentConnected(false)
      wsRef.current = null
    }

    ws.onerror = () => ws.close()
  }, [url, token])

  const disconnect = useCallback(() => wsRef.current?.close(), [])

  const send = useCallback(
    (action: string, data?: Record<string, unknown>): Promise<Record<string, unknown>> =>
      new Promise((resolve, reject) => {
        const ws = wsRef.current
        if (!ws || ws.readyState !== WebSocket.OPEN) { reject(new Error('Not connected')); return }

        const id = crypto.randomUUID()
        const timer = setTimeout(() => {
          pendingRef.current.delete(id)
          reject(new Error(`Timeout: ${action}`))
        }, 30000)

        pendingRef.current.set(id, (msg) => {
          clearTimeout(timer)
          if (msg.type === 'error') reject(new Error(msg.message as string))
          else resolve(msg)
        })

        ws.send(JSON.stringify({ type: 'cmd', id, action, ...data }))
      }),
    []
  )

  return { state, agentConnected, agentInfo, connect, disconnect, send }
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function RemoteControlPage() {
  const [relayUrl, setRelayUrl] = useState('ws://localhost:3001')
  const [token, setToken] = useState('changeme-please')
  const [showSettings, setShowSettings] = useState(false)

  const { state, agentConnected, agentInfo, connect, disconnect, send } = useRelay(relayUrl, token)

  // ── Screen state ────────────────────────────────────────────────────────────
  const [screenshot, setScreenshot] = useState<{ data: string; width: number; height: number } | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshMs, setRefreshMs] = useState(2000)
  const [captureInput, setCaptureInput] = useState(false)
  const screenRef = useRef<HTMLDivElement>(null)
  const autoRefreshTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const mouseMoveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Files state ─────────────────────────────────────────────────────────────
  const [currentPath, setCurrentPath] = useState('~')
  const [dirEntries, setDirEntries] = useState<FileEntry[]>([])
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string; encoding: string } | null>(null)
  const [loadingFiles, setLoadingFiles] = useState(false)

  // ── Processes state ─────────────────────────────────────────────────────────
  const [processes, setProcesses] = useState<ProcessEntry[]>([])
  const [processFilter, setProcessFilter] = useState('')
  const [loadingProcs, setLoadingProcs] = useState(false)

  // ── Terminal state ──────────────────────────────────────────────────────────
  const [termHistory, setTermHistory] = useState<TerminalEntry[]>([])
  const [termInput, setTermInput] = useState('')
  const [termCwd, setTermCwd] = useState('~')
  const termEndRef = useRef<HTMLDivElement>(null)

  // ── Screenshot ──────────────────────────────────────────────────────────────
  const takeScreenshot = useCallback(async () => {
    if (!agentConnected) return
    try {
      const r = await send('screenshot')
      setScreenshot({ data: r.data as string, width: r.width as number, height: r.height as number })
    } catch (e) { console.error(e) }
  }, [agentConnected, send])

  useEffect(() => {
    if (autoRefresh && agentConnected) {
      autoRefreshTimer.current = setInterval(takeScreenshot, refreshMs)
    }
    return () => { if (autoRefreshTimer.current) clearInterval(autoRefreshTimer.current) }
  }, [autoRefresh, agentConnected, refreshMs, takeScreenshot])

  // ── Screen mouse events ─────────────────────────────────────────────────────
  const calcCoords = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!screenRef.current || !screenshot) return null
    const rect = screenRef.current.getBoundingClientRect()
    return {
      x: Math.round((e.clientX - rect.left) * (screenshot.width / rect.width)),
      y: Math.round((e.clientY - rect.top) * (screenshot.height / rect.height))
    }
  }, [screenshot])

  const handleScreenClick = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!agentConnected) return
    const coords = calcCoords(e)
    if (!coords) return
    await send('click', { button: e.button === 2 ? 'right' : 'left', ...coords })
    setTimeout(takeScreenshot, 300)
  }, [agentConnected, calcCoords, send, takeScreenshot])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!agentConnected || !captureInput || mouseMoveTimer.current) return
    const coords = calcCoords(e)
    if (!coords) return
    mouseMoveTimer.current = setTimeout(() => { mouseMoveTimer.current = null }, 50)
    send('mousemove', coords).catch(() => {})
  }, [agentConnected, captureInput, calcCoords, send])

  const handleScroll = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!agentConnected || !captureInput) return
    send('scroll', { deltaX: Math.round(e.deltaX / 100), deltaY: Math.round(e.deltaY / 100) }).catch(() => {})
  }, [agentConnected, captureInput, send])

  // ── Keyboard capture ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!captureInput) return
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      const mods: string[] = []
      if (e.ctrlKey) mods.push('Control')
      if (e.altKey) mods.push('Alt')
      if (e.shiftKey) mods.push('Shift')
      if (e.metaKey) mods.push('Meta')

      if (mods.length > 0) {
        send('keycombo', { keys: [...mods, e.key] }).catch(() => {})
      } else if (e.key.length === 1) {
        send('type', { text: e.key }).catch(() => {})
      } else {
        send('keypress', { key: e.key }).catch(() => {})
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [captureInput, send])

  // ── File manager ────────────────────────────────────────────────────────────
  const loadDir = useCallback(async (p: string) => {
    setLoadingFiles(true)
    try {
      const r = await send('listdir', { path: p })
      setCurrentPath(r.path as string)
      setDirEntries(r.entries as FileEntry[])
    } catch (e) { console.error(e) }
    finally { setLoadingFiles(false) }
  }, [send])

  const openFile = useCallback(async (p: string) => {
    try {
      const r = await send('readfile', { path: p })
      setSelectedFile({ path: r.path as string, content: r.content as string, encoding: r.encoding as string })
    } catch (e) { console.error(e) }
  }, [send])

  useEffect(() => {
    if (agentConnected) loadDir('~')
  }, [agentConnected, loadDir])

  // ── Processes ───────────────────────────────────────────────────────────────
  const loadProcesses = useCallback(async () => {
    if (!agentConnected) return
    setLoadingProcs(true)
    try {
      const r = await send('listprocesses')
      setProcesses(r.processes as ProcessEntry[])
    } catch (e) { console.error(e) }
    finally { setLoadingProcs(false) }
  }, [agentConnected, send])

  const killProcess = useCallback(async (pid: number) => {
    await send('killprocess', { pid })
    await loadProcesses()
  }, [send, loadProcesses])

  // ── Terminal ────────────────────────────────────────────────────────────────
  const runCommand = useCallback(async () => {
    if (!termInput.trim() || !agentConnected) return
    const command = termInput
    const cwd = termCwd
    setTermInput('')
    const id = crypto.randomUUID()
    setTermHistory(h => [...h, { id, command, cwd, stdout: '', stderr: '', exitCode: null, running: true }])
    try {
      const r = await send('runcommand', { command, cwd })
      setTermHistory(h => h.map(e => e.id === id
        ? { ...e, stdout: r.stdout as string, stderr: r.stderr as string, exitCode: r.exitCode as number, running: false }
        : e))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setTermHistory(h => h.map(e => e.id === id ? { ...e, stderr: msg, exitCode: 1, running: false } : e))
    }
    setTimeout(() => termEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [termInput, termCwd, agentConnected, send])

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const fmtSize = (b: number) => b < 1024 ? `${b}B` : b < 1048576 ? `${(b / 1024).toFixed(1)}K` : `${(b / 1048576).toFixed(1)}M`

  const pathParts = currentPath.replace(/\\/g, '/').split('/').filter(Boolean)

  const stateColor = {
    connected: 'text-green-400',
    connecting: 'text-yellow-400',
    disconnected: 'text-red-400'
  }[state]

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="border-b px-4 py-2 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 font-semibold">
          <Monitor className="w-5 h-5" />
          ClawCaster Remote Control
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            {state === 'connected'
              ? <Wifi className="w-4 h-4 text-green-400" />
              : <WifiOff className="w-4 h-4 text-red-400" />}
            <span className={stateColor}>Relay: {state}</span>
          </div>

          {agentInfo && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-muted-foreground">{agentInfo.username}@{agentInfo.hostname}</span>
              <Badge variant="outline" className="text-xs">{agentInfo.platform}</Badge>
              {agentConnected
                ? <Badge variant="default" className="text-xs bg-green-600">Agent online</Badge>
                : <Badge variant="destructive" className="text-xs">Agent offline</Badge>}
            </>
          )}

          <Button
            size="sm"
            variant={state === 'connected' ? 'destructive' : 'default'}
            onClick={state === 'connected' ? disconnect : connect}
          >
            {state === 'connecting' ? 'Connecting…' : state === 'connected' ? 'Disconnect' : 'Connect'}
          </Button>

          <Button size="sm" variant="ghost" onClick={() => setShowSettings(s => !s)}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* ── Settings panel ───────────────────────────────────────────────────── */}
      {showSettings && (
        <div className="border-b bg-muted/30 px-4 py-3 flex flex-wrap items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Relay URL</Label>
            <Input
              value={relayUrl}
              onChange={e => setRelayUrl(e.target.value)}
              className="h-7 w-56 text-sm"
              placeholder="ws://localhost:3001"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Token</Label>
            <Input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              className="h-7 w-44 text-sm"
            />
          </div>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-4 overflow-hidden">
        <Tabs defaultValue="screen" className="flex flex-col h-full">
          <TabsList className="shrink-0">
            <TabsTrigger value="screen" className="gap-1.5">
              <Monitor className="w-4 h-4" />Screen
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-1.5">
              <Folder className="w-4 h-4" />Files
            </TabsTrigger>
            <TabsTrigger value="processes" className="gap-1.5" onClick={loadProcesses}>
              <Cpu className="w-4 h-4" />Processes
            </TabsTrigger>
            <TabsTrigger value="terminal" className="gap-1.5">
              <TerminalIcon className="w-4 h-4" />Terminal
            </TabsTrigger>
          </TabsList>

          {/* ── Screen ──────────────────────────────────────────────────────── */}
          <TabsContent value="screen" className="mt-3 flex-1 flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <Button size="sm" onClick={takeScreenshot} disabled={!agentConnected}>
                <RefreshCw className="w-4 h-4 mr-1" />Screenshot
              </Button>
              <Button
                size="sm"
                variant={autoRefresh ? 'destructive' : 'outline'}
                onClick={() => setAutoRefresh(a => !a)}
                disabled={!agentConnected}
              >
                {autoRefresh ? <Square className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {autoRefresh ? 'Stop' : 'Auto'} ({refreshMs / 1000}s)
              </Button>
              <select
                value={refreshMs}
                onChange={e => setRefreshMs(Number(e.target.value))}
                className="h-8 rounded border bg-background text-sm px-2"
              >
                {[500, 1000, 2000, 5000].map(v => (
                  <option key={v} value={v}>{v / 1000}s</option>
                ))}
              </select>
              <Button
                size="sm"
                variant={captureInput ? 'default' : 'outline'}
                onClick={() => setCaptureInput(c => !c)}
                disabled={!agentConnected}
              >
                <MousePointer className="w-4 h-4 mr-1" />
                {captureInput ? 'Release keyboard' : 'Capture input'}
              </Button>
              {agentInfo && (
                <span className="text-xs text-muted-foreground ml-1">
                  {agentInfo.screenWidth}×{agentInfo.screenHeight}
                </span>
              )}
            </div>

            <div
              ref={screenRef}
              className="relative border rounded-lg overflow-hidden bg-black cursor-crosshair flex-1"
              style={{ maxHeight: 'calc(100vh - 260px)' }}
              onClick={handleScreenClick}
              onMouseMove={handleMouseMove}
              onWheel={handleScroll}
              onContextMenu={e => e.preventDefault()}
            >
              {screenshot ? (
                <img
                  src={`data:image/png;base64,${screenshot.data}`}
                  alt="Remote screen"
                  className="w-full h-full object-contain pointer-events-none select-none"
                  draggable={false}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                  {agentConnected ? 'Click "Screenshot" to view the remote screen' : 'Connect to an agent first'}
                </div>
              )}
              {captureInput && (
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  ⌨ Keyboard captured — press ESC to release
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Files ───────────────────────────────────────────────────────── */}
          <TabsContent value="files" className="mt-3 flex-1 flex flex-col gap-3">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 flex-wrap shrink-0">
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => loadDir('~')}>
                <Home className="w-4 h-4" />
              </Button>
              <span className="text-muted-foreground text-sm">/</span>
              {pathParts.map((part, i) => (
                <span key={i} className="flex items-center gap-1 text-sm">
                  <button
                    className="hover:underline"
                    onClick={() => loadDir('/' + pathParts.slice(0, i + 1).join('/'))}
                  >
                    {part}
                  </button>
                  {i < pathParts.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                </span>
              ))}
              <Button size="sm" variant="ghost" className="h-7 px-2 ml-2" onClick={() => loadDir(currentPath)} disabled={loadingFiles}>
                <RefreshCw className={`w-4 h-4 ${loadingFiles ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
              {/* Directory listing */}
              <ScrollArea className="border rounded-lg h-[calc(100vh-320px)]">
                <div className="p-1">
                  {dirEntries.map(entry => (
                    <div
                      key={entry.path}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded cursor-pointer group"
                      onClick={() => entry.type === 'directory' ? loadDir(entry.path) : openFile(entry.path)}
                    >
                      <span>{entry.type === 'directory' ? '📁' : '📄'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm">{entry.name}</div>
                        {entry.type === 'file' && (
                          <div className="text-xs text-muted-foreground">{fmtSize(entry.size)}</div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-destructive shrink-0"
                        onClick={async e => {
                          e.stopPropagation()
                          if (!confirm(`Delete "${entry.name}"?`)) return
                          await send('deletefile', { path: entry.path })
                          loadDir(currentPath)
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {dirEntries.length === 0 && !loadingFiles && (
                    <p className="text-center text-muted-foreground py-8 text-sm">Empty directory</p>
                  )}
                </div>
              </ScrollArea>

              {/* File viewer */}
              <div className="border rounded-lg flex flex-col overflow-hidden h-[calc(100vh-320px)]">
                {selectedFile ? (
                  <>
                    <div className="border-b px-3 py-2 flex items-center justify-between bg-muted/30 shrink-0">
                      <span className="text-xs text-muted-foreground truncate">{selectedFile.path}</span>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={() => setSelectedFile(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <ScrollArea className="flex-1">
                      <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all">
                        {selectedFile.encoding === 'base64' ? '[Binary file — cannot display]' : selectedFile.content}
                      </pre>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
                    Click a file to view its contents
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Processes ───────────────────────────────────────────────────── */}
          <TabsContent value="processes" className="mt-3 flex-1 flex flex-col gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" onClick={loadProcesses} disabled={loadingProcs || !agentConnected}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loadingProcs ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Input
                value={processFilter}
                onChange={e => setProcessFilter(e.target.value)}
                placeholder="Filter by name or PID…"
                className="h-8 w-52 text-sm"
              />
              {processes.length > 0 && (
                <span className="text-sm text-muted-foreground">{processes.length} processes</span>
              )}
            </div>

            <ScrollArea className="border rounded-lg flex-1 h-[calc(100vh-280px)]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b">
                  <tr>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium w-20">PID</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Command</th>
                    <th className="text-right px-3 py-2 text-muted-foreground font-medium w-16">CPU%</th>
                    <th className="text-right px-3 py-2 text-muted-foreground font-medium w-16">MEM%</th>
                    <th className="w-16 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {processes
                    .filter(p =>
                      !processFilter ||
                      p.command.toLowerCase().includes(processFilter.toLowerCase()) ||
                      String(p.pid).includes(processFilter)
                    )
                    .map(proc => (
                      <tr key={proc.pid} className="border-b hover:bg-muted/30">
                        <td className="px-3 py-1.5 font-mono text-muted-foreground">{proc.pid}</td>
                        <td className="px-3 py-1.5 max-w-xs truncate">{proc.command}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{proc.cpu.toFixed(1)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{proc.mem.toFixed(1)}</td>
                        <td className="px-3 py-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm(`Kill PID ${proc.pid} (${proc.command})?`)) killProcess(proc.pid)
                            }}
                          >
                            Kill
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {processes.length === 0 && !loadingProcs && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  {agentConnected ? 'Click Refresh to load processes' : 'Connect to an agent first'}
                </p>
              )}
            </ScrollArea>
          </TabsContent>

          {/* ── Terminal ────────────────────────────────────────────────────── */}
          <TabsContent value="terminal" className="mt-3 flex-1 flex flex-col gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-muted-foreground">cwd:</span>
              <Input
                value={termCwd}
                onChange={e => setTermCwd(e.target.value)}
                className="h-8 w-72 text-sm font-mono"
                placeholder="Working directory"
              />
              <Button size="sm" variant="ghost" onClick={() => setTermHistory([])}>Clear</Button>
            </div>

            <ScrollArea className="border rounded-lg bg-zinc-950 flex-1 h-[calc(100vh-330px)]">
              <div className="p-3 font-mono text-sm space-y-3">
                {termHistory.length === 0 && (
                  <p className="text-zinc-500">Type a command below and press Enter.</p>
                )}
                {termHistory.map(entry => (
                  <div key={entry.id}>
                    <div className="flex items-start gap-1">
                      <span className="text-zinc-500 shrink-0">{entry.cwd} $</span>
                      <span className="text-green-400">{entry.command}</span>
                    </div>
                    {entry.running && <p className="text-yellow-400 animate-pulse pl-4">Running…</p>}
                    {entry.stdout && (
                      <pre className="text-zinc-200 whitespace-pre-wrap text-xs pl-4 mt-0.5">{entry.stdout}</pre>
                    )}
                    {entry.stderr && (
                      <pre className="text-red-400 whitespace-pre-wrap text-xs pl-4 mt-0.5">{entry.stderr}</pre>
                    )}
                    {!entry.running && entry.exitCode !== 0 && entry.exitCode !== null && (
                      <p className="text-red-500 text-xs pl-4">Exit: {entry.exitCode}</p>
                    )}
                  </div>
                ))}
                <div ref={termEndRef} />
              </div>
            </ScrollArea>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-green-400 font-mono text-sm shrink-0">$</span>
              <Input
                value={termInput}
                onChange={e => setTermInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') runCommand() }}
                placeholder={agentConnected ? 'Enter command…' : 'Connect to agent first'}
                className="font-mono text-sm"
                disabled={!agentConnected}
              />
              <Button onClick={runCommand} disabled={!agentConnected || !termInput.trim()}>
                Run
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
