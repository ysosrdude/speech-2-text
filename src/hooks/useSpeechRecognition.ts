import { useCallback, useEffect, useRef, useState } from 'react'

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export type UseSpeechRecognitionOptions = {
  enabled: boolean
  lang?: string
  onUtteranceEnd: (transcript: string) => void
}

export function useSpeechRecognition({
  enabled,
  lang = 'en-US',
  onUtteranceEnd,
}: UseSpeechRecognitionOptions) {
  const ctor = getSpeechRecognitionCtor()
  const supported = ctor !== null

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const enabledRef = useRef(enabled)
  const onUtteranceEndRef = useRef(onUtteranceEnd)

  const [interimTranscript, setInterimTranscript] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)
  const [speechError, setSpeechError] = useState<string | null>(null)

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    onUtteranceEndRef.current = onUtteranceEnd
  }, [onUtteranceEnd])

  const stopRecognition = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsCapturing(false)
    setInterimTranscript('')
  }, [])

  const startRecognition = useCallback(() => {
    if (!ctor || !enabledRef.current) return

    setSpeechError(null)

    const recognition = new ctor()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = lang
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsCapturing(true)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0]?.transcript ?? ''
        if (result.isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }

      setInterimTranscript(interim || final)

      if (final.trim()) {
        setInterimTranscript('')
        onUtteranceEndRef.current(final.trim())
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted' || event.error === 'no-speech') {
        return
      }
      setSpeechError(event.error)
      setIsCapturing(false)
    }

    recognition.onend = () => {
      setIsCapturing(false)
      setInterimTranscript('')
      if (enabledRef.current) {
        window.setTimeout(() => {
          if (!enabledRef.current) return
          try {
            recognition.start()
          } catch {
            // start() can throw if called too quickly after onend
          }
        }, 250)
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      setSpeechError('microphone_unavailable')
    }
  }, [ctor, lang])

  useEffect(() => {
    if (!supported) return

    if (enabled) {
      startRecognition()
    } else {
      stopRecognition()
    }

    return () => {
      enabledRef.current = false
      stopRecognition()
    }
  }, [enabled, supported, startRecognition, stopRecognition])

  return {
    supported,
    interimTranscript,
    isCapturing,
    speechError,
  }
}
