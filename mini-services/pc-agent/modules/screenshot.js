'use strict'

const os = require('os')
const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

async function takeScreenshot() {
  // On Linux use system tools directly (screenshot-desktop can return black frames)
  if (os.platform() !== 'linux') {
    try {
      const screenshot = require('screenshot-desktop')
      const buf = await screenshot({ format: 'png' })
      const { width, height } = getScreenSize()
      return { data: buf.toString('base64'), width, height }
    } catch {}
  }

  // System tools (Linux: scrot, macOS: screencapture, Windows: PowerShell)
  const tmpFile = path.join(os.tmpdir(), `cc_sc_${Date.now()}.png`)
  try {
    await captureWithSystemTool(tmpFile)
    const data = fs.readFileSync(tmpFile).toString('base64')
    const { width, height } = getScreenSize()
    return { data, width, height }
  } finally {
    try { fs.unlinkSync(tmpFile) } catch {}
  }
}

async function captureWithSystemTool(outFile) {
  const platform = os.platform()

  if (platform === 'linux') {
    const tools = [
      `scrot -o "${outFile}"`,
      `import -window root "${outFile}"`,
      `gnome-screenshot -f "${outFile}"`,
      `xwd -root -silent | convert xwd:- "${outFile}"`
    ]
    for (const cmd of tools) {
      try { await execAsync(cmd, { timeout: 5000 }); return } catch {}
    }
    throw new Error('No screenshot tool found. Install scrot: sudo apt install scrot')
  }

  if (platform === 'darwin') {
    await execAsync(`screencapture -x "${outFile}"`, { timeout: 5000 })
    return
  }

  if (platform === 'win32') {
    const ps = [
      'Add-Type -AssemblyName System.Windows.Forms,System.Drawing',
      '$b=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds',
      '$bmp=New-Object System.Drawing.Bitmap($b.Width,$b.Height)',
      '$g=[System.Drawing.Graphics]::FromImage($bmp)',
      '$g.CopyFromScreen([System.Drawing.Point]::Empty,[System.Drawing.Point]::Empty,$b.Size)',
      `$bmp.Save('${outFile.replace(/\\/g, '\\\\')}')`,
      '$g.Dispose();$bmp.Dispose()'
    ].join(';')
    await execAsync(`powershell -command "${ps}"`, { timeout: 10000 })
    return
  }

  throw new Error(`Unsupported platform: ${platform}`)
}

function getScreenSize() {
  try {
    const robot = require('robotjs')
    return robot.getScreenSize()
  } catch {
    return { width: 1920, height: 1080 }
  }
}

module.exports = { takeScreenshot }
