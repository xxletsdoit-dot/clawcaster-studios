'use strict'

const fs = require('fs').promises
const path = require('path')
const os = require('os')

const MAX_READ_SIZE = 10 * 1024 * 1024 // 10 MB

function resolvePath(p) {
  if (!p || p === '~') return os.homedir()
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2))
  return path.resolve(p)
}

async function handleFiles(action, msg) {
  switch (action) {
    case 'listdir': {
      const dir = resolvePath(msg.path)
      const rawEntries = await fs.readdir(dir, { withFileTypes: true })
      const entries = await Promise.all(rawEntries.map(async (e) => {
        const fullPath = path.join(dir, e.name)
        let size = 0, mtime = null
        try {
          const stat = await fs.stat(fullPath)
          size = stat.size
          mtime = stat.mtime.toISOString()
        } catch {}
        return {
          name: e.name,
          type: e.isDirectory() ? 'directory' : e.isSymbolicLink() ? 'symlink' : 'file',
          size,
          mtime,
          path: fullPath
        }
      }))
      entries.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1
        if (a.type !== 'directory' && b.type === 'directory') return 1
        return a.name.localeCompare(b.name)
      })
      return { path: dir, parent: path.dirname(dir), entries }
    }

    case 'readfile': {
      const filePath = resolvePath(msg.path)
      const stat = await fs.stat(filePath)
      if (stat.size > MAX_READ_SIZE) {
        throw new Error(`File too large (${(stat.size / 1024 / 1024).toFixed(1)} MB). Max 10 MB.`)
      }
      const buf = await fs.readFile(filePath)
      // Detect binary by checking for null bytes in first 8 KB
      const isBinary = buf.slice(0, 8192).some(b => b === 0)
      return {
        path: filePath,
        content: isBinary ? buf.toString('base64') : buf.toString('utf8'),
        encoding: isBinary ? 'base64' : 'utf8',
        size: stat.size
      }
    }

    case 'writefile': {
      const filePath = resolvePath(msg.path)
      const content = msg.encoding === 'base64'
        ? Buffer.from(msg.content, 'base64')
        : Buffer.from(msg.content ?? '', 'utf8')
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, content)
      return { path: filePath, size: content.length }
    }

    case 'deletefile': {
      const filePath = resolvePath(msg.path)
      const stat = await fs.stat(filePath)
      if (stat.isDirectory()) {
        await fs.rm(filePath, { recursive: true, force: true })
      } else {
        await fs.unlink(filePath)
      }
      return { path: filePath }
    }

    case 'makedir': {
      const dir = resolvePath(msg.path)
      await fs.mkdir(dir, { recursive: true })
      return { path: dir }
    }

    case 'movefile': {
      const src = resolvePath(msg.src)
      const dst = resolvePath(msg.dst)
      await fs.rename(src, dst)
      return { src, dst }
    }

    case 'copyfile': {
      const src = resolvePath(msg.src)
      const dst = resolvePath(msg.dst)
      await fs.copyFile(src, dst)
      return { src, dst }
    }

    default:
      throw new Error(`Unknown file action: ${action}`)
  }
}

module.exports = { handleFiles }
