export type ConversationTurn = {
  id: string
  transcript: string
  response: string
  createdAt: number
}

export type ListenerStatus =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'error'
  | 'unsupported'
