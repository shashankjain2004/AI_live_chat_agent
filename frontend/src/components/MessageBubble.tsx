import styles from './MessageBubble.module.css'

export interface ChatEntry {
  id: string
  sender: 'user' | 'ai' | 'error'
  text: string
  timestamp: Date
}

interface Props {
  entry: ChatEntry
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ entry }: Props) {
  return (
    <div className={`${styles.row} ${styles[entry.sender]}`}>
      {(entry.sender === 'ai' || entry.sender === 'error') && (
        <div className={styles.avatar}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M1.5 12.5c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </div>
      )}
      <div className={styles.wrap}>
        <div className={`${styles.bubble} ${styles[entry.sender]}`}>
          {entry.sender === 'error' && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
              <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          )}
          <span>{entry.text}</span>
        </div>
        <time className={styles.time}>{formatTime(entry.timestamp)}</time>
      </div>
    </div>
  )
}
