import { useState } from 'react'

const KEY = 'spur_chat_session_id'

export function useSession() {
  const [sessionId, setSessionIdState] = useState<string | undefined>(
    () => localStorage.getItem(KEY) ?? undefined
  )

  const setSessionId = (id: string) => {
    localStorage.setItem(KEY, id)
    setSessionIdState(id)
  }

  const clearSession = () => {
    localStorage.removeItem(KEY)
    setSessionIdState(undefined)
  }

  return { sessionId, setSessionId, clearSession }
}
