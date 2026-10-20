import { useConversationListener } from '../../hooks/useConversationListener'
import { StatusBadge } from './StatusBadge'

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

  return (
    <section className="conversation" aria-live="polite">
      <header className="conversation-header">
        <div>
          <h1>Live conversation</h1>
          <p className="conversation-lead">
            Speak naturally. When you pause, your words are sent for a text response on screen.
          </p>
        </div>
        <StatusBadge status={status} listening={listening} isCapturing={isCapturing} />
      </header>

      {!speechSupported && (
        <p className="conversation-alert" role="alert">
          Speech recognition is not supported in this browser. Use Chrome, Edge, or Safari on desktop.
        </p>
      )}

      {speechSupported && !apiConfigured && (
        <p className="conversation-alert" role="alert">
          Set <code>VITE_API_TOKEN</code> in a <code>.env</code> file (see <code>.env.example</code>
          ), then restart <code>npm run dev</code>.
        </p>
      )}

      {(errorMessage || speechError) && (
        <p className="conversation-alert conversation-alert-error" role="alert">
          {errorMessage ?? `Speech error: ${speechError}`}
        </p>
      )}

      <div className="conversation-controls">
        {!listening ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={startListening}
            disabled={!speechSupported}
          >
            Start listening
          </button>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={stopListening}>
            Stop
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={clearHistory}
          disabled={turns.length === 0 && !lastTranscript}
        >
          Clear
        </button>
      </div>

      <div className="conversation-panels">
        <article className="panel panel-live">
          <h2>Live input</h2>
          {listening ? (
            <p className="panel-body panel-interim">
              {interimTranscript || (isCapturing ? 'Listening…' : 'Waiting for speech…')}
            </p>
          ) : (
            <p className="panel-body panel-muted">Press “Start listening” to begin.</p>
          )}
          {lastTranscript && (
            <footer className="panel-footer">
              <span className="panel-label">Last utterance</span>
              <p>{lastTranscript}</p>
            </footer>
          )}
        </article>

        <article className="panel panel-response">
          <h2>Text response</h2>
          {status === 'processing' && (
            <p className="panel-body panel-muted">Generating response…</p>
          )}
          {latestTurn && status !== 'processing' && (
            <p className="panel-body panel-response-text">{latestTurn.response}</p>
          )}
          {!latestTurn && status !== 'processing' && (
            <p className="panel-body panel-muted">Responses appear here after you finish speaking.</p>
          )}
        </article>
      </div>

      {turns.length > 0 && (
        <section className="conversation-history" aria-label="Conversation history">
          <h2>History</h2>
          <ol className="history-list">
            {turns.map((turn) => (
              <li key={turn.id} className="history-item">
                <p className="history-you">
                  <span className="history-label">You</span>
                  {turn.transcript}
                </p>
                <p className="history-assistant">
                  <span className="history-label">Assistant</span>
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
