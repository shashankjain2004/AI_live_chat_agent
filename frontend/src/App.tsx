import { useEffect, useRef, useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import ChatHeader from './components/ChatHeader'
import MessageBubble, { type ChatEntry } from './components/MessageBubble'
import TypingIndicator from './components/TypingIndicator'
import ChatInput from './components/ChatInput'
import Welcome from './components/Welcome'
import { sendMessage, fetchHistory } from './lib/api'
import { useSession } from './hooks/useSession'
import styles from './App.module.css'

let idCounter = 0
const genId = () => `local-${++idCounter}`

export default function App() {
  const [messages, setMessages] = useState<ChatEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { sessionId, setSessionId, clearSession } = useSession()

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  // Load history on mount if session exists
  useEffect(() => {
    if (!sessionId) return
    fetchHistory(sessionId)
      .then((msgs) => {
        if (msgs.length === 0) return
        setShowWelcome(false)
        setMessages(
          msgs.map((m) => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
            timestamp: new Date(m.created_at),
          }))
        )
        setTimeout(() => scrollToBottom(false), 50)
      })
      .catch(() => clearSession())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  const handleSend = useCallback(async (text: string) => {
    setShowWelcome(false)
    setIsLoading(true)

    setMessages((prev) => [
      ...prev,
      { id: genId(), sender: 'user', text, timestamp: new Date() },
    ])

    try {
      const data = await sendMessage(text, sessionId)
      setSessionId(data.sessionId)
      setMessages((prev) => [
        ...prev,
        { id: genId(), sender: 'ai', text: data.reply, timestamp: new Date() },
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setMessages((prev) => [
        ...prev,
        { id: genId(), sender: 'error', text: msg, timestamp: new Date() },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, setSessionId])

  const handleSuggestion = useCallback((text: string) => {
    handleSend(text)
  }, [handleSend])

  const handleNewChat = useCallback(() => {
    clearSession()
    setMessages([])
    setShowWelcome(true)
  }, [clearSession])

  return (
    <div className={styles.shell}>
      <Sidebar onNewChat={handleNewChat} />

      <main className={styles.chatArea}>
        <ChatHeader onNewChat={handleNewChat} />

        <section className={styles.messages}>
          {showWelcome && <Welcome onSuggestion={handleSuggestion} />}

          {messages.map((entry) => (
            <MessageBubble key={entry.id} entry={entry} />
          ))}

          {isLoading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </section>

        <ChatInput onSend={handleSend} disabled={isLoading} />
      </main>
    </div>
  )
}
