import styles from './ChatHeader.module.css'

interface Props {
  onNewChat: () => void
}

export default function ChatHeader({ onNewChat }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.agentInfo}>
        <div className={styles.avatar}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 17c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div className={styles.name}>Bloom Support</div>
          <div className={styles.status}>
            <span className={styles.onlineDot} />
            Online now
          </div>
        </div>
      </div>
      <button className={styles.iconBtn} onClick={onNewChat} title="New chat">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 1.5v15M1.5 9h15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </header>
  )
}
