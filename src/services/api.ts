import type { ApiError } from '../types'

const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${DEFAULT_BASE_URL}${path}`)

  if (!response.ok) {
    const error: ApiError = {
      message: `Request failed with status ${response.status}`,
      code: String(response.status),
    }
    throw error
  }

  return (await response.json()) as T
}
