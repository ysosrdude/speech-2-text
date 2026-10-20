import type { VercelRequest, VercelResponse } from '@vercel/node'

const CURSOR_API = 'https://api.cursor.com'

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  const apiKey = process.env.CURSOR_API_KEY?.trim() || process.env.VITE_API_TOKEN?.trim()
  if (!apiKey) {
    res.status(500).json({
      code: 'missing_token',
      message: 'Set CURSOR_API_KEY in Vercel → Settings → Environment Variables, then redeploy.',
    })
    return
  }

  const pathParam = req.query.path
  const pathSuffix =
    typeof pathParam === 'string'
      ? pathParam
      : Array.isArray(pathParam)
        ? pathParam.join('/')
        : ''

  if (!pathSuffix) {
    res.status(200).json({
      ok: true,
      message: 'Cursor proxy is running. Call /api/cursor/v1/me or /api/cursor/v1/agents.',
    })
    return
  }

  const upstreamPath = `/${pathSuffix}`

  try {
    const upstream = await fetch(`${CURSOR_API}${upstreamPath}`, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        ...(req.headers['content-type']
          ? { 'Content-Type': String(req.headers['content-type']) }
          : {}),
      },
      body:
        req.method === 'GET' || req.method === 'HEAD'
          ? undefined
          : req.body
            ? JSON.stringify(req.body)
            : undefined,
    })

    const body = Buffer.from(await upstream.arrayBuffer())
    res.status(upstream.status)
    const contentType = upstream.headers.get('content-type')
    if (contentType) {
      res.setHeader('Content-Type', contentType)
    }
    res.end(body)
  } catch {
    res.status(502).json({
      code: 'proxy_unreachable',
      message: 'Could not reach api.cursor.com from the hosted proxy.',
    })
  }
}
