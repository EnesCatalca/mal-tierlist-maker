const { app, BrowserWindow } = require('electron')
const http = require('http')
const https = require('https')
const path = require('path')
const fs = require('fs')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
}

function startServer(callback) {
  const distPath = path.join(__dirname, '..', 'dist')

  const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url, 'http://localhost')

    // MAL proxy
    if (reqUrl.pathname === '/api/mal') {
      const username = reqUrl.searchParams.get('username') || ''
      const status   = reqUrl.searchParams.get('status')   || '2'
      const offset   = reqUrl.searchParams.get('offset')   || '0'

      if (!username) {
        res.writeHead(400)
        res.end(JSON.stringify({ error: 'username required' }))
        return
      }

      const malReq = https.request(
        {
          hostname: 'myanimelist.net',
          path: `/animelist/${encodeURIComponent(username)}/load.json?status=${status}&offset=${offset}`,
          method: 'GET',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Referer': `https://myanimelist.net/animelist/${username}`,
            'Accept-Language': 'en-US,en;q=0.9',
          },
        },
        (malRes) => {
          const chunks = []
          malRes.on('data', (c) => chunks.push(c))
          malRes.on('end', () => {
            res.writeHead(malRes.statusCode, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            })
            res.end(Buffer.concat(chunks))
          })
        }
      )

      malReq.on('error', (err) => {
        res.writeHead(500)
        res.end(JSON.stringify({ error: err.message }))
      })
      malReq.end()
      return
    }

    // Static files from dist/
    let filePath = path.join(distPath, reqUrl.pathname)
    let stat
    try { stat = fs.statSync(filePath) } catch { stat = null }
    if (!stat || stat.isDirectory()) filePath = path.join(distPath, 'index.html')

    try {
      const content = fs.readFileSync(filePath)
      const ext = path.extname(filePath).toLowerCase()
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
      res.end(content)
    } catch {
      res.writeHead(404)
      res.end('Not found')
    }
  })

  server.listen(0, '127.0.0.1', () => {
    callback(server.address().port)
  })
}

app.whenReady().then(() => {
  startServer((port) => {
    const win = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 900,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
      title: 'MAL Tierlist Maker',
      autoHideMenuBar: true,
    })

    win.loadURL(`http://127.0.0.1:${port}`)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
