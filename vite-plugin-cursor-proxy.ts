import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

const CURSOR_API = 'https://api.cursor.com'

function readRequestBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: Record<string, string>) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function createMiddleware(apiKey?: string) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url ?? ''
    if (!url.startsWith('/api/cursor')) {
      next()
      return
    }

    if (!apiKey) {
      sendJson(res, 500, {
        code: 'missing_token',
        message:
          'VITE_API_TOKEN is not set. Add your Cursor API key (crsr_…) to .env and restart npm run dev.',
      })
      return
    }

    const upstreamPath = url.replace(/^\/api\/cursor/, '') || '/'
    const upstreamUrl = `${CURSOR_API}${upstreamPath}`
    const method = req.method ?? 'GET'

    try {
      const body =
        method === 'GET' || method === 'HEAD' ? undefined : await readRequestBody(req)

      const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      }

      const contentType = req.headers['content-type']
      if (contentType && body?.length) {
        headers['Content-Type'] = contentType
      }

      const upstream = await fetch(upstreamUrl, {
        method,
        headers,
        body: body?.length ? body : undefined,
      })

      res.statusCode = upstream.status
      const responseType = upstream.headers.get('content-type')
      if (responseType) {
        res.setHeader('Content-Type', responseType)
      }

      res.end(Buffer.from(await upstream.arrayBuffer()))
    } catch {
      sendJson(res, 502, {
        code: 'proxy_unreachable',
        message:
          'Could not reach api.cursor.com from this dev server (socket/proxy error). StackBlitz often blocks this — run npm run dev on your machine instead, or use a hosted backend proxy.',
      })
    }
  }
}

export function cursorApiProxy(apiKey?: string): Plugin {
  const middleware = createMiddleware(apiKey)

  return {
    name: 'cursor-api-proxy',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
