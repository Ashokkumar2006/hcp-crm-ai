import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { addUserMessage, sendChatMessage } from '../../redux/slices/chatSlice'
import Button from '../atoms/Button'

export default function AIAssistantChat() {
  const dispatch = useDispatch()
  const { messages, status } = useSelector((state) => state.chat)
  const repId = useSelector((state) => state.auth.repId)
  const activeInteractionId = useSelector((state) => state.chat.activeInteractionId)
  const [text, setText] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, status])

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || status === 'loading') return
    dispatch(addUserMessage(trimmed))
    dispatch(sendChatMessage({ message: trimmed, repId, interactionId: activeInteractionId }))
    setText('')
  }

  return (
    <div className="panel chat-panel">
      <div className="panel-header chat-header">
        <span className="chat-header-icon">✨</span>
        AI Assistant
        <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
          — Log interaction via chat
        </span>
      </div>

      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="chat-empty-state">
            Log interaction details here (e.g., "Met Dr. Smith, discussed Product X efficacy,
            positive sentiment, shared brochure") or ask for help.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            {m.content}
          </div>
        ))}
        {status === 'loading' && (
          <div className="chat-typing">
            <span /><span /><span />
          </div>
        )}
      </div>

      <div className="chat-input-row">
        <input
          className="input"
          placeholder="Describe interaction..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <Button onClick={handleSend} loading={status === 'loading'}>
          Log
        </Button>
      </div>
    </div>
  )
}
