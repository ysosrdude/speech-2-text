import type { ReactNode } from 'react'
import { useConversationListener } from '../../hooks/useConversationListener'
import type { ListenerStatus } from '../../types/conversation'
import '../../styles/conversation.css'

function statusLabel(
  status: ListenerStatus,
  listening: boolean,
  isCapturing: boolean,
): string {
  if (listening && isCapturing && status === 'listening') return 'Listening'
  const labels: Record<ListenerStatus, string> = {
    idle: 'Ready',
    listening: 'Listening',
    processing: 'Thinking',
    error: 'Error',
    unsupported: 'Unsupported',
  }
  return labels[status]
}

export function ConversationPanel() {
  const {
    listening,
    status,
    turns,
    lastTranscript,
    interimTranscript,
    isCapturing,
    speechError,
    errorMessage,
    apiConfigured,
    speechSupported,
    startListening,
    stopListening,
    clearHistory,
  } = useConversationListener()

  const latestTurn = turns.at(-1)
  const liveText =
    interimTranscript || (isCapturing ? '…' : listening ? 'Waiting for your voice' : '')

  const notices: Array<{ text: ReactNode; error?: boolean }> = []
  if (!speechSupported) {
    notices.push({
      text: 'Speech recognition needs Chrome, Edge, or Safari on desktop.',
    })
  } else if (!apiConfigured) {
    notices.push({
      text: (
        <>
          Add <code>VITE_API_TOKEN</code> to <code>.env</code>, then restart the dev server.
        </>
      ),
    })
  }
  if (errorMessage || speechError) {
    notices.push({
      error: true,
      text: errorMessage ?? `Speech error: ${speechError}`,
    })
  }

  return (
    <section className="conversation" aria-live="polite">
      <header className="conversation-intro">
        <h1>Speak, pause, read</h1>
        <p>Live speech is transcribed as you talk. When you stop, the app fetches a written reply.</p>
      </header>

      <div className="conversation-meta">
        <div className="controls">
          {listening ? (
            <button type="button" className="btn btn--quiet" onClick={stopListening}>
              Stop
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary"
              onClick={startListening}
              disabled={!speechSupported}
            >
              Start listening
            </button>
          )}
          <button
            type="button"
            className="btn btn--quiet"
            onClick={clearHistory}
            disabled={turns.length === 0 && !lastTranscript}
          >
            Clear
          </button>
        </div>
        <span className={`status status--${status}`} aria-label={`Status: ${statusLabel(status, listening, isCapturing)}`}>
          <span className="status-dot" aria-hidden="true" />
          {statusLabel(status, listening, isCapturing)}
        </span>
      </div>

      {notices.map((notice, index) => (
        <p
          key={index}
          className={`notice${notice.error ? ' notice--error' : ''}`}
          role="alert"
        >
          {notice.text}
        </p>
      ))}

      <div className="stage">
        <article className="card">
          <h2 className="card-label">Live</h2>
          {listening ? (
            <p className={`card-body card-body--live${liveText ? '' : ' card-body--muted'}`}>
              {liveText || 'Listening…'}
            </p>
          ) : (
            <p className="card-body card-body--muted">Press start when you are ready to talk.</p>
          )}
          {lastTranscript && (
            <footer className="card-foot">
              <span>Last said</span>
              {lastTranscript}
            </footer>
          )}
        </article>

        <article className="card">
          <h2 className="card-label">Reply</h2>
          {status === 'processing' && (
            <p className="card-body card-body--muted">Composing reply…</p>
          )}
          {latestTurn && status !== 'processing' && (
            <p className="card-body card-body--reply">{latestTurn.response}</p>
          )}
          {!latestTurn && status !== 'processing' && (
            <p className="card-body card-body--muted">Your answer will show up here after a pause.</p>
          )}
        </article>
      </div>

      {turns.length > 1 && (
        <section className="history" aria-label="Earlier turns">
          <h2>Earlier</h2>
          <ol className="history-list">
            {turns.slice(0, -1).reverse().map((turn) => (
              <li key={turn.id} className="history-item">
                <p>
                  <span className="history-tag">You</span>
                  {turn.transcript}
                </p>
                <p>
                  <span className="history-tag">Reply</span>
                  {turn.response}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </section>
  )
}
