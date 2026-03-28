'use strict'

const os = require('os')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

async function listProcesses() {
  const platform = os.platform()

  if (platform === 'linux' || platform === 'darwin') {
    const { stdout } = await execAsync('ps aux --no-header 2>/dev/null || ps aux', { timeout: 10000 })
    const processes = []
    for (const line of stdout.trim().split('\n')) {
      const parts = line.trim().split(/\s+/)
      if (parts.length < 11) continue
      processes.push({
        user: parts[0],
        pid: parseInt(parts[1], 10),
        cpu: parseFloat(parts[2]),
        mem: parseFloat(parts[3]),
        command: parts.slice(10).join(' ')
      })
    }
    return processes.sort((a, b) => b.cpu - a.cpu)
  }

  if (platform === 'win32') {
    const { stdout } = await execAsync(
      'powershell -command "Get-Process | Select-Object Id,Name,CPU,WorkingSet | ConvertTo-Json -Compress"',
      { timeout: 10000 }
    )
    const raw = JSON.parse(stdout)
    return (Array.isArray(raw) ? raw : [raw]).map(p => ({
      pid: p.Id,
      command: p.Name,
      cpu: p.CPU ?? 0,
      mem: Math.round((p.WorkingSet ?? 0) / 1024 / 1024 * 10) / 10,
      user: ''
    }))
  }

  return []
}

async function killProcess(pid) {
  const platform = os.platform()
  if (platform === 'win32') {
    await execAsync(`taskkill /PID ${pid} /F`, { timeout: 5000 })
  } else {
    await execAsync(`kill -9 ${pid}`, { timeout: 5000 })
  }
  return { pid, killed: true }
}

async function handleProcesses(action, msg) {
  switch (action) {
    case 'listprocesses':
      return { processes: await listProcesses() }
    case 'killprocess':
      return await killProcess(msg.pid)
    default:
      throw new Error(`Unknown process action: ${action}`)
  }
}

module.exports = { handleProcesses }
