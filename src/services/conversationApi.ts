import type { ApiError } from '../types'

type CursorRun = {
  id: string
  agentId: string
  status: 'CREATING' | 'RUNNING' | 'FINISHED' | 'ERROR' | 'CANCELLED' | 'EXPIRED'
  result?: string
  error?: unknown
}

type CreateAgentResponse = {
  agent: { id: string }
  run: CursorRun
}

type CreateRunResponse = {
  run: CursorRun
}

type CursorErrorBody = {
  code?: string
  message?: string
  error?: string | { message?: string }
}

const session = {
  agentId: null as string | null,
}

function getApiConfig() {
  const token = import.meta.env.VITE_API_TOKEN?.trim()
  const baseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() || '/api/cursor').replace(/\/$/, '')
  const model = import.meta.env.VITE_API_MODEL?.trim()

  return { token, baseUrl, model }
}

/** Same-origin Vite/Vercel proxy (`/api/cursor`). */
function usesLocalProxy(baseUrl: string) {
  return baseUrl.startsWith('/')
}

/** Hosted proxy (e.g. Vercel) — API key stays on the server. */
function usesRemoteProxy(baseUrl: string) {
  return baseUrl.startsWith('http://') || baseUrl.startsWith('https://')
}

export function isApiConfigured(): boolean {
  const { token, baseUrl } = getApiConfig()
  if (usesRemoteProxy(baseUrl)) return true
  return Boolean(token)
}

export function isRemoteProxyMode(): boolean {
  return usesRemoteProxy(getApiConfig().baseUrl)
}

export function resetConversationSession() {
  session.agentId = null
}

function buildPrompt(transcript: string) {
  return [
    'The user spoke this question in a live voice conversation.',
    'Reply in clear plain text only (no markdown fences). Keep it concise and conversational.',
    '',
    transcript.trim(),
  ].join('\n')
}

async function cursorRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { token, baseUrl } = getApiConfig()
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')

  if (usesLocalProxy(baseUrl)) {
    if (!token) {
      const error: ApiError = {
        message: 'Missing VITE_API_TOKEN. Add your Cursor API key to .env and restart the dev server.',
        code: 'missing_token',
      }
      throw error
    }
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  })

  const payload = (await response.json().catch(() => ({}))) as T & CursorErrorBody

  if (!response.ok) {
    const nested =
      typeof payload.error === 'object' && payload.error?.message
        ? payload.error.message
        : typeof payload.error === 'string'
          ? payload.error
          : undefined

    let message = payload.message ?? nested ?? `Cursor API request failed (${response.status})`

    if (response.status === 502 && payload.code === 'proxy_unreachable') {
      message = payload.message ?? message
    } else if (response.status === 502) {
      message =
        'Could not reach Cursor through the proxy (502). On StackBlitz, point VITE_API_BASE_URL at a Vercel deploy (see README).'
    } else if (response.status === 500 && payload.code === 'missing_token') {
      message = payload.message ?? 'Proxy is missing CURSOR_API_KEY on the server.'
    }

    const error: ApiError = {
      message,
      code: payload.code ?? String(response.status),
    }
    throw error
  }

  return payload
}

async function wait(ms: number) {
  await new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function pollRun(agentId: string, runId: string): Promise<string> {
  const deadline = Date.now() + 120_000

  while (Date.now() < deadline) {
    const run = await cursorRequest<CursorRun>(`/v1/agents/${agentId}/runs/${runId}`)

    if (run.status === 'FINISHED') {
      const text = run.result?.trim()
      if (!text) {
        const error: ApiError = {
          message: 'Cursor finished without a text reply. Try asking again.',
          code: 'empty_response',
        }
        throw error
      }
      return text
    }

    if (run.status === 'ERROR' || run.status === 'CANCELLED' || run.status === 'EXPIRED') {
      const error: ApiError = {
        message: 'Cursor could not complete this request. Try again in a moment.',
        code: run.status,
      }
      throw error
    }

    await wait(1500)
  }

  const error: ApiError = {
    message: 'Cursor is taking longer than expected. Try a shorter question.',
    code: 'timeout',
  }
  throw error
}

async function createAgentRun(transcript: string) {
  const { model } = getApiConfig()
  const body: Record<string, unknown> = {
    prompt: { text: buildPrompt(transcript) },
  }

  if (model) {
    body.model = { id: model }
  }

  const created = await cursorRequest<CreateAgentResponse>('/v1/agents', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  session.agentId = created.agent.id
  return { agentId: created.agent.id, runId: created.run.id }
}

async function createFollowUpRun(agentId: string, transcript: string) {
  const created = await cursorRequest<CreateRunResponse>(`/v1/agents/${agentId}/runs`, {
    method: 'POST',
    body: JSON.stringify({
      prompt: { text: buildPrompt(transcript) },
    }),
  })

  return created.run.id
}

export async function fetchConversationResponse(transcript: string): Promise<string> {
  const { token, baseUrl } = getApiConfig()

  if (usesLocalProxy(baseUrl) && !token) {
    const error: ApiError = {
      message:
        'Missing VITE_API_TOKEN. Add your Cursor API key (crsr_…) to .env and restart npm run dev.',
      code: 'missing_token',
    }
    throw error
  }

  let agentId = session.agentId
  let runId: string

  if (!agentId) {
    const created = await createAgentRun(transcript)
    agentId = created.agentId
    runId = created.runId
  } else {
    try {
      runId = await createFollowUpRun(agentId, transcript)
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.code === 'agent_busy' || apiError.code === '409') {
        await wait(2000)
        runId = await createFollowUpRun(agentId, transcript)
      } else {
        throw error
      }
    }
  }

  return pollRun(agentId, runId)
}
