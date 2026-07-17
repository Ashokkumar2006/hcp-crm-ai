import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  fetchInteractionById,
  createInteraction,
  updateInteraction,
  resetDraft,
} from '../redux/slices/interactionsSlice'
import { clearChat, setActiveInteractionId } from '../redux/slices/chatSlice'
import InteractionForm from '../components/organisms/InteractionForm'
import AIAssistantChat from '../components/organisms/AIAssistantChat'

export default function LogInteraction() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const repId = useSelector((state) => state.auth.repId)
  const draft = useSelector((state) => state.interactions.currentDraft)
  const currentInteractionId = useSelector((state) => state.interactions.currentInteractionId)
  const activeChatInteractionId = useSelector((state) => state.chat.activeInteractionId)
  const chatMessageCount = useSelector((state) => state.chat.messages.length)
  const lastFollowups = useSelector((state) => state.chat.lastFollowups)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    dispatch(clearChat())
    if (id) {
      dispatch(fetchInteractionById(id))
      dispatch(setActiveInteractionId(id))
    } else {
      dispatch(resetDraft())
    }
  }, [id, dispatch])

  useEffect(() => {
    if (activeChatInteractionId) {
      dispatch(fetchInteractionById(activeChatInteractionId))
    }
  }, [chatMessageCount, activeChatInteractionId, dispatch])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  async function handleSubmit() {
    if (!draft.hcp_id) {
      setToast({ type: 'error', message: 'Please select an HCP before saving.' })
      return
    }
    setSubmitting(true)

    try {
      const normalizedTime = draft.time && draft.time.length === 5 ? `${draft.time}:00` : draft.time

      const payload = {
        hcp_id: draft.hcp_id,
        rep_id: repId,
        date: draft.date || new Date().toISOString().slice(0, 10),
        time: normalizedTime || new Date().toTimeString().slice(0, 8),
        interaction_type: draft.interaction_type || 'Meeting',
        attendees: draft.attendees || [],
        topics_discussed: draft.topics_discussed || '',
        sentiment: draft.sentiment || 'neutral',
        outcomes: draft.outcomes || '',
        follow_up_actions: (draft.follow_up_actions || []).filter(Boolean),
        material_ids: draft.material_ids || [],
        sample_ids: draft.sample_ids || [],
      }

      const targetId = currentInteractionId || activeChatInteractionId
      if (targetId) {
        await dispatch(updateInteraction({ id: targetId, payload })).unwrap()
      } else {
        await dispatch(createInteraction(payload)).unwrap()
      }
      setToast({ type: 'success', message: 'Interaction saved successfully.' })
      setTimeout(() => navigate('/'), 900)
    } catch (err) {
      console.error('Save interaction failed:', err)
      const message = `Could not save: ${JSON.stringify(err)}`
      setToast({ type: 'error', message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Log HCP Interaction</h1>
          <p className="page-subtitle">
            Fill the form directly, or describe the visit to the AI Assistant on the right.
          </p>
        </div>
      </div>

      <div className="log-interaction-grid">
        <InteractionForm onSubmit={handleSubmit} submitting={submitting} followups={lastFollowups} />
        <AIAssistantChat />
      </div>

      {toast && <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>{toast.message}</div>}
    </div>
  )
}