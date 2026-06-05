import styles from './Welcome.module.css'

const SUGGESTIONS = [
  "What's your return policy?",
  'Do you ship internationally?',
  'How long does shipping take?',
  'What payment methods do you accept?',
]

interface Props {
  onSuggestion: (text: string) => void
}

export default function Welcome({ onSuggestion }: Props) {
  return (
    <div className={styles.welcome}>
      <div className={styles.icon}>🌸</div>
      <h2 className={styles.title}>Hi there! How can we help?</h2>
      <p className={styles.sub}>
        Ask us anything about shipping, returns, orders, or our products.
      </p>
      <div className={styles.suggestions}>
        {SUGGESTIONS.map((s) => (
          <button key={s} className={styles.chip} onClick={() => onSuggestion(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
