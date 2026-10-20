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

function usesDevProxy(baseUrl: string) {
  return baseUrl.startsWith('/')
}

export function isApiConfigured(): boolean {
  return Boolean(getApiConfig().token)
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

  if (!usesDevProxy(baseUrl)) {
    if (!token) {
      const error: ApiError = {
        message: 'Missing VITE_API_TOKEN. Add your Cursor API key to .env and restart the dev server.',
        code: 'missing_token',
      }
      throw error
    }
    headers.set('Authorization', `Bearer ${token}`)
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

    const error: ApiError = {
      message: payload.message ?? nested ?? `Cursor API request failed (${response.status})`,
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

  if (!token) {
    const error: ApiError = {
      message:
        'Missing VITE_API_TOKEN. Create a Cursor API key (crsr_…) in the dashboard, add it to .env, and restart npm run dev.',
      code: 'missing_token',
    }
    throw error
  }

  if (!usesDevProxy(baseUrl)) {
    const error: ApiError = {
      message:
        'Direct browser calls to api.cursor.com are blocked by CORS. Use the default VITE_API_BASE_URL=/api/cursor with npm run dev.',
      code: 'cors',
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
