import { useSelector, useDispatch } from 'react-redux'
import { updateDraftField } from '../../redux/slices/interactionsSlice'
import FormField from '../atoms/FormField'
import SentimentSelector from '../atoms/SentimentSelector'
import Button from '../atoms/Button'
import HCPSearchSelect from '../molecules/HCPSearchSelect'
import CatalogSearchAdd from '../molecules/CatalogSearchAdd'
import AttendeesInput from '../molecules/AttendeesInput'

const INTERACTION_TYPES = ['Meeting', 'Call', 'Email', 'Conference', 'Sample Drop']

export default function InteractionForm({ onSubmit, submitting, followups }) {
  const dispatch = useDispatch()
  const draft = useSelector((state) => state.interactions.currentDraft)

  function setField(field, value) {
    dispatch(updateDraftField({ field, value }))
  }

  function selectHCP(hcp) {
    setField('hcp_id', hcp.id)
    setField('hcp', hcp)
  }

  function addMaterial(item) {
    setField('materials', [...(draft.materials || []), item])
    setField('material_ids', [...draft.material_ids, item.id])
  }

  function removeMaterial(id) {
    setField('materials', (draft.materials || []).filter((m) => m.id !== id))
    setField('material_ids', draft.material_ids.filter((mid) => mid !== id))
  }

  function addSample(item) {
    setField('samples', [...(draft.samples || []), item])
    setField('sample_ids', [...draft.sample_ids, item.id])
  }

  function removeSample(id) {
    setField('samples', (draft.samples || []).filter((s) => s.id !== id))
    setField('sample_ids', draft.sample_ids.filter((sid) => sid !== id))
  }

  return (
    <form
      className="panel"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <div className="panel-header">Interaction Details</div>
      <div className="panel-body">
        <div className="form-row">
          <FormField label="HCP Name">
            <HCPSearchSelect value={draft.hcp} onSelect={selectHCP} />
          </FormField>
          <FormField label="Interaction Type">
            <select
              className="select"
              value={draft.interaction_type}
              onChange={(e) => setField('interaction_type', e.target.value)}
            >
              {[...new Set([...INTERACTION_TYPES, draft.interaction_type].filter(Boolean))].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="form-row">
          <FormField label="Date">
            <input
              type="date"
              className="input"
              value={draft.date}
              onChange={(e) => setField('date', e.target.value)}
            />
          </FormField>
          <FormField label="Time">
            <input
              type="time"
              className="input"
              value={draft.time}
              onChange={(e) => setField('time', e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Attendees">
          <AttendeesInput
            attendees={draft.attendees}
            onChange={(attendees) => setField('attendees', attendees)}
          />
        </FormField>

        <FormField label="Topics Discussed">
          <textarea
            className="textarea"
            placeholder="Enter key discussion points..."
            value={draft.topics_discussed}
            onChange={(e) => setField('topics_discussed', e.target.value)}
          />
          <button type="button" className="voice-btn">
            🎙 Summarize from Voice Note (Requires Consent)
          </button>
        </FormField>

        <FormField label="Materials Shared">
          <CatalogSearchAdd
            endpoint="/catalog/materials"
            placeholder="Search / Add material..."
            selectedItems={draft.materials || []}
            onAdd={addMaterial}
            onRemove={removeMaterial}
          />
        </FormField>

        <FormField label="Samples Distributed">
          <CatalogSearchAdd
            endpoint="/catalog/samples"
            placeholder="Search / Add sample..."
            selectedItems={draft.samples || []}
            onAdd={addSample}
            onRemove={removeSample}
          />
        </FormField>

        <FormField label="Observed / Inferred HCP Sentiment">
          <SentimentSelector
            value={draft.sentiment}
            onChange={(val) => setField('sentiment', val)}
          />
        </FormField>

        <FormField label="Outcomes">
          <textarea
            className="textarea"
            placeholder="Key outcomes or agreements..."
            value={draft.outcomes}
            onChange={(e) => setField('outcomes', e.target.value)}
          />
        </FormField>

        <FormField label="Follow-up Actions">
          <textarea
            className="textarea"
            placeholder="Enter next steps or tasks..."
            value={(draft.follow_up_actions || []).join('\n')}
            onChange={(e) => setField('follow_up_actions', e.target.value.split('\n'))}
          />
        </FormField>

        {followups && followups.length > 0 && (
          <FormField label="AI Suggested Follow-ups">
            <ul className="followup-list">
              {followups.map((f, i) => (
                <li key={i} className="followup-item">
                  <span>{f}</span>
                  <span
                    style={{ cursor: 'pointer', fontWeight: 600 }}
                    onClick={() =>
                      setField('follow_up_actions', [...(draft.follow_up_actions || []).filter(Boolean), f])
                    }
                  >
                    +
                  </span>
                </li>
              ))}
            </ul>
          </FormField>
        )}

        <Button type="submit" loading={submitting} block>
          Save Interaction
        </Button>
      </div>
    </form>
  )
}
