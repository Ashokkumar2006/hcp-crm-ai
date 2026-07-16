const OPTIONS = [
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
]

export default function SentimentSelector({ value, onChange }) {
  return (
    <div className="sentiment-group">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`sentiment-pill ${opt.value} ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
