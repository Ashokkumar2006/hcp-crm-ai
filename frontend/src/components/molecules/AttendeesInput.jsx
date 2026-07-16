import { useState } from 'react'

export default function AttendeesInput({ attendees, onChange }) {
  const [text, setText] = useState('')

  function addAttendee() {
    const trimmed = text.trim()
    if (trimmed && !attendees.includes(trimmed)) {
      onChange([...attendees, trimmed])
    }
    setText('')
  }

  return (
    <div>
      <input
        className="input"
        placeholder="Enter names, press Enter to add..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            addAttendee()
          }
        }}
      />
      {attendees.length === 0 ? (
        <p className="empty-hint" style={{ marginTop: 'var(--space-2)' }}>No attendees added</p>
      ) : (
        <div className="chip-list">
          {attendees.map((name) => (
            <span key={name} className="chip">
              {name}
              <span
                className="chip-remove"
                onClick={() => onChange(attendees.filter((a) => a !== name))}
              >
                ×
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
