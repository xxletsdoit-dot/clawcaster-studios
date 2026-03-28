'use strict'

const os = require('os')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

let robot = null
try {
  robot = require('robotjs')
  console.log('[input] robotjs loaded')
} catch {
  console.warn('[input] robotjs not available — using xdotool fallback (Linux only)')
}

// Map web/X11 key names to robotjs key names
const KEY_MAP = {
  Enter: 'enter', Return: 'enter',
  Backspace: 'backspace', Delete: 'delete',
  Escape: 'escape', Tab: 'tab',
  ' ': 'space', Space: 'space',
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  Home: 'home', End: 'end',
  PageUp: 'pageup', PageDown: 'pagedown',
  Insert: 'insert',
  F1: 'f1', F2: 'f2', F3: 'f3', F4: 'f4',
  F5: 'f5', F6: 'f6', F7: 'f7', F8: 'f8',
  F9: 'f9', F10: 'f10', F11: 'f11', F12: 'f12',
  // Modifiers as stand-alone keys
  Control: 'control', Shift: 'shift', Alt: 'alt', Meta: 'command',
  ctrl: 'control', shift: 'shift', alt: 'alt', meta: 'command', cmd: 'command'
}

function mapKey(key) {
  return KEY_MAP[key] ?? key.toLowerCase()
}

async function handleInput(action, msg) {
  if (robot) return handleWithRobot(action, msg)
  if (os.platform() === 'linux') return handleWithXdotool(action, msg)
  throw new Error('No input backend available. Run: npm install robotjs')
}

function handleWithRobot(action, msg) {
  switch (action) {
    case 'mousemove':
      robot.moveMouse(msg.x, msg.y)
      return { ok: true }

    case 'click': {
      if (msg.x != null) robot.moveMouse(msg.x, msg.y)
      robot.mouseClick(msg.button === 'right' ? 'right' : msg.button === 'middle' ? 'middle' : 'left')
      return { ok: true }
    }

    case 'dblclick': {
      if (msg.x != null) robot.moveMouse(msg.x, msg.y)
      robot.mouseClick(msg.button === 'right' ? 'right' : 'left', true)
      return { ok: true }
    }

    case 'mousedown': {
      if (msg.x != null) robot.moveMouse(msg.x, msg.y)
      robot.mouseToggle('down', msg.button === 'right' ? 'right' : 'left')
      return { ok: true }
    }

    case 'mouseup':
      robot.mouseToggle('up', msg.button === 'right' ? 'right' : 'left')
      return { ok: true }

    case 'scroll': {
      const dx = Math.round(msg.deltaX ?? 0)
      const dy = Math.round(msg.deltaY ?? 0)
      robot.scrollMouse(dx, dy)
      return { ok: true }
    }

    case 'keypress':
      robot.keyTap(mapKey(msg.key), msg.modifiers?.map(mapKey) ?? [])
      return { ok: true }

    case 'keycombo': {
      const keys = msg.keys ?? []
      if (keys.length === 0) return { ok: true }
      const mods = keys.slice(0, -1).map(mapKey)
      const key = mapKey(keys[keys.length - 1])
      robot.keyTap(key, mods)
      return { ok: true }
    }

    case 'type':
      robot.typeString(msg.text ?? '')
      return { ok: true }

    default:
      throw new Error(`Unknown input action: ${action}`)
  }
}

async function handleWithXdotool(action, msg) {
  let cmd
  switch (action) {
    case 'mousemove':
      cmd = `xdotool mousemove ${msg.x} ${msg.y}`
      break
    case 'click': {
      const btn = msg.button === 'right' ? 3 : msg.button === 'middle' ? 2 : 1
      cmd = msg.x != null
        ? `xdotool mousemove ${msg.x} ${msg.y} click ${btn}`
        : `xdotool click ${btn}`
      break
    }
    case 'dblclick': {
      cmd = msg.x != null
        ? `xdotool mousemove ${msg.x} ${msg.y} click --repeat 2 1`
        : `xdotool click --repeat 2 1`
      break
    }
    case 'scroll': {
      const btn = (msg.deltaY ?? 0) < 0 ? 4 : 5
      cmd = `xdotool click ${btn}`
      break
    }
    case 'keypress':
      cmd = `xdotool key ${msg.key}`
      break
    case 'keycombo':
      cmd = `xdotool key ${(msg.keys ?? []).join('+')}`
      break
    case 'type': {
      const escaped = (msg.text ?? '').replace(/'/g, "'\\''")
      cmd = `xdotool type --clearmodifiers '${escaped}'`
      break
    }
    default:
      throw new Error(`Unknown input action: ${action}`)
  }
  await execAsync(cmd, { timeout: 5000 })
  return { ok: true }
}

module.exports = { handleInput }
