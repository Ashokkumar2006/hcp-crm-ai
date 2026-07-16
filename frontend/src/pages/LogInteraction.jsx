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
  const { id } = useParams() // present only when editing an existing interaction
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const repId = useSelector((state) => state.auth.repId)
  const draft = useSelector((state) => state.interactions.currentDraft)
  const currentInteractionId = useSelector((state) => state.interactions.currentInteractionId)
  const activeChatInteractionId = useSelector((state) => state.chat.activeInteractionId)
  const lastFollowups = useSelector((state) => state.chat.lastFollowups)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  // Load existing interaction when editing via URL, or reset for a fresh log
  useEffect(() => {
    dispatch(clearChat())
    if (id) {
      dispatch(fetchInteractionById(id))
      dispatch(setActiveInteractionId(id)) // so chat edits target this interaction, not a new one
    } else {
      dispatch(resetDraft())
    }
  }, [id, dispatch])

  // When the AI chat creates/edits an interaction, sync the form to show the result
  useEffect(() => {
    if (activeChatInteractionId && activeChatInteractionId !== currentInteractionId) {
      dispatch(fetchInteractionById(activeChatInteractionId))
    }
  }, [activeChatInteractionId, currentInteractionId, dispatch])

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
    const payload = {
      hcp_id: draft.hcp_id,
      rep_id: repId,
      date: draft.date,
      time: draft.time,
      interaction_type: draft.interaction_type,
      attendees: draft.attendees,
      topics_discussed: draft.topics_discussed,
      sentiment: draft.sentiment,
      outcomes: draft.outcomes,
      follow_up_actions: draft.follow_up_actions.filter(Boolean),
      material_ids: draft.material_ids,
      sample_ids: draft.sample_ids,
    }

    try {
      const targetId = currentInteractionId || activeChatInteractionId
      if (targetId) {
        await dispatch(updateInteraction({ id: targetId, payload })).unwrap()
      } else {
        await dispatch(createInteraction(payload)).unwrap()
      }
      setToast({ type: 'success', message: 'Interaction saved successfully.' })
      setTimeout(() => navigate('/'), 900)
    } catch (err) {
      setToast({ type: 'error', message: 'Could not save. Check required fields and try again.' })
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
