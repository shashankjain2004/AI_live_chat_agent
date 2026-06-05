import styles from './TypingIndicator.module.css'

export default function TypingIndicator() {
  return (
    <div className={styles.row}>
      <div className={styles.avatar}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1.5 12.5c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </div>
      <div className={styles.bubble}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  )
}
