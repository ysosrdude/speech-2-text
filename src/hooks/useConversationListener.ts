import { useCallback, useState } from 'react'
import { fetchConversationResponse, isApiConfigured } from '../services/conversationApi'
import type { ApiError } from '../types'
import type { ConversationTurn, ListenerStatus } from '../types/conversation'
import { useSpeechRecognition } from './useSpeechRecognition'

function createTurnId() {
  return crypto.randomUUID()
}

export function useConversationListener() {
  const [listening, setListening] = useState(false)
  const [status, setStatus] = useState<ListenerStatus>('idle')
  const [turns, setTurns] = useState<ConversationTurn[]>([])
  const [lastTranscript, setLastTranscript] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleUtteranceEnd = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return

    setLastTranscript(transcript)
    setStatus('processing')
    setErrorMessage(null)

    try {
      const response = await fetchConversationResponse(transcript)
      const turn: ConversationTurn = {
        id: createTurnId(),
        transcript,
        response,
        createdAt: Date.now(),
      }
      setTurns((prev) => [...prev, turn])
      setStatus('listening')
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message ?? 'Something went wrong while fetching a response.')
      setStatus('error')
    }
  }, [])

  const { supported, interimTranscript, isCapturing, speechError } = useSpeechRecognition({
    enabled: listening,
    onUtteranceEnd: (transcript) => {
      void handleUtteranceEnd(transcript)
    },
  })

  const startListening = useCallback(() => {
    if (!supported) {
      setStatus('unsupported')
      return
    }
    if (!isApiConfigured()) {
      setErrorMessage('Add VITE_API_TOKEN to your .env file, then restart the dev server.')
      setStatus('error')
      return
    }
    setErrorMessage(null)
    setListening(true)
    setStatus('listening')
  }, [supported])

  const stopListening = useCallback(() => {
    setListening(false)
    setStatus('idle')
  }, [])

  const clearHistory = useCallback(() => {
    setTurns([])
    setLastTranscript('')
    setErrorMessage(null)
    if (!listening) {
      setStatus('idle')
    }
  }, [listening])

  return {
    listening,
    status,
    turns,
    lastTranscript,
    interimTranscript,
    isCapturing,
    speechError,
    errorMessage,
    apiConfigured: isApiConfigured(),
    speechSupported: supported,
    startListening,
    stopListening,
    clearHistory,
  }
}
