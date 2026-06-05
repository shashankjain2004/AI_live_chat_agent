import styles from './Sidebar.module.css'

interface Props {
  onNewChat: () => void
}

export default function Sidebar({ onNewChat }: Props) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>B&amp;S</div>
        <div className={styles.brandText}>
          <span className={styles.brandName}>Bloom &amp; Ship</span>
          <span className={styles.brandTagline}>Handcrafted goods</span>
        </div>
      </div>

      <nav className={styles.nav}>
        <button className={styles.newChatBtn} onClick={onNewChat}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          New conversation
        </button>
      </nav>

      <div className={styles.footer}>
        <span className={styles.statusDot} />
        <span>Support is online</span>
      </div>
    </aside>
  )
}
