import type { ListenerStatus } from '../../types/conversation'

type StatusBadgeProps = {
  status: ListenerStatus
  listening: boolean
  isCapturing: boolean
}

const LABELS: Record<ListenerStatus, string> = {
  idle: 'Idle',
  listening: 'Listening',
  processing: 'Processing',
  error: 'Error',
  unsupported: 'Unsupported',
}

export function StatusBadge({ status, listening, isCapturing }: StatusBadgeProps) {
  const label =
    listening && isCapturing && status === 'listening' ? 'Listening (active)' : LABELS[status]

  return (
    <span className={`status-badge status-${status}`} aria-label={`Status: ${label}`}>
      <span className="status-dot" aria-hidden="true" />
      {label}
    </span>
  )
}
