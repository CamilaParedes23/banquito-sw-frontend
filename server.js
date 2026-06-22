const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = Number(process.env.PORT || 3000)
const DIST_DIR = path.join(__dirname, 'dist')
const BASE_PATH = '/switch'

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase()
  const contentType = MIME_TYPES[extension] || 'application/octet-stream'

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500, {
        'Content-Type': 'text/plain; charset=utf-8',
      })
      response.end(error.code === 'ENOENT' ? 'Not found' : 'Internal server error')
      return
    }

    response.writeHead(200, { 'Content-Type': contentType })
    response.end(data)
  })
}

function resolvePath(urlPath) {
  if (urlPath === '/' || urlPath === '') {
    return { redirect: `${BASE_PATH}/` }
  }

  if (urlPath === BASE_PATH || urlPath === `${BASE_PATH}/`) {
    return { filePath: path.join(DIST_DIR, 'index.html') }
  }

  if (urlPath.startsWith(`${BASE_PATH}/assets/`)) {
    return { filePath: path.join(DIST_DIR, urlPath.slice(BASE_PATH.length + 1)) }
  }

  if (urlPath.startsWith(`${BASE_PATH}/`)) {
    const relativePath = urlPath.slice(BASE_PATH.length + 1)
    const staticCandidate = path.join(DIST_DIR, relativePath)

    if (fs.existsSync(staticCandidate) && fs.statSync(staticCandidate).isFile()) {
      return { filePath: staticCandidate }
    }

    return { filePath: path.join(DIST_DIR, 'index.html') }
  }

  const directCandidate = path.join(DIST_DIR, urlPath.slice(1))
  if (fs.existsSync(directCandidate) && fs.statSync(directCandidate).isFile()) {
    return { filePath: directCandidate }
  }

  return { statusCode: 404 }
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)
  const resolution = resolvePath(decodeURIComponent(url.pathname))

  if (resolution.redirect) {
    response.writeHead(302, { Location: resolution.redirect })
    response.end()
    return
  }

  if (resolution.statusCode) {
    response.writeHead(resolution.statusCode, {
      'Content-Type': 'text/plain; charset=utf-8',
    })
    response.end('Not found')
    return
  }

  sendFile(response, resolution.filePath)
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serving switch frontend on http://0.0.0.0:${PORT}${BASE_PATH}/`)
})
