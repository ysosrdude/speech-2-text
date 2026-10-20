import type { ApiError } from '../types'

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: {
    message?: string
  }
}

function getApiConfig() {
  const token = import.meta.env.VITE_API_TOKEN?.trim()
  const baseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(
    /\/$/,
    '',
  )
  const model = import.meta.env.VITE_API_MODEL?.trim() || 'gpt-4o-mini'

  return { token, baseUrl, model }
}

export function isApiConfigured(): boolean {
  return Boolean(getApiConfig().token)
}

export async function fetchConversationResponse(transcript: string): Promise<string> {
  const { token, baseUrl, model } = getApiConfig()

  if (!token) {
    const error: ApiError = {
      message: 'Missing VITE_API_TOKEN. Add it to your .env file and restart the dev server.',
      code: 'missing_token',
    }
    throw error
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content:
            'You are a concise assistant in a live speech conversation. Answer clearly in plain text. Keep responses focused and conversational.',
        },
        {
          role: 'user',
          content: transcript,
        },
      ],
    }),
  })

  const payload = (await response.json()) as ChatCompletionResponse

  if (!response.ok) {
    const error: ApiError = {
      message: payload.error?.message ?? `API request failed (${response.status})`,
      code: String(response.status),
    }
    throw error
  }

  const text = payload.choices?.[0]?.message?.content?.trim()
  if (!text) {
    const error: ApiError = {
      message: 'The API returned an empty response.',
      code: 'empty_response',
    }
    throw error
  }

  return text
}
