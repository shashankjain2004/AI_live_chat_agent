import { useRef, useState } from 'react'
import styles from './ChatInput.module.css'

const MAX_CHARS = 2000

interface Props {
  onSend: (text: string) => void
  disabled: boolean
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    resize()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const submit = () => {
    const text = value.trim()
    if (!text || disabled || text.length > MAX_CHARS) return
    onSend(text)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const isOverLimit = value.length > MAX_CHARS
  const canSend = value.trim().length > 0 && !disabled && !isOverLimit

  return (
    <footer className={styles.footer}>
      <div className={`${styles.wrapper} ${isOverLimit ? styles.overLimit : ''}`}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          disabled={disabled}
          aria-label="Message input"
          className={styles.textarea}
        />
        <div className={styles.actions}>
          {value.length > MAX_CHARS * 0.8 && (
            <span className={`${styles.charCount} ${isOverLimit ? styles.warn : ''}`}>
              {value.length}/{MAX_CHARS}
            </span>
          )}
          <button
            className={styles.sendBtn}
            onClick={submit}
            disabled={!canSend}
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 15V3M3 9l6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      <p className={styles.hint}>Press Enter to send · Shift+Enter for new line</p>
    </footer>
  )
}
