const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface Message {
  id: string
  conversation_id: string
  sender: 'user' | 'ai'
  text: string
  created_at: string
}

export interface SendMessageResponse {
  reply: string
  sessionId: string
}

export async function sendMessage(
  message: string,
  sessionId?: string
): Promise<SendMessageResponse> {
  const res = await fetch(`${API_BASE}/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId }),
    signal: AbortSignal.timeout(30_000),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to send message')
  return data as SendMessageResponse
}

export async function fetchHistory(sessionId: string): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/chat/history/${sessionId}`, {
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error('Could not load history')
  const data = await res.json()
  return data.messages as Message[]
}
