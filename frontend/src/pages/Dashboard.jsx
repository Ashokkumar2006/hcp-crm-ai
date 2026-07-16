import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { fetchInteractions } from '../redux/slices/interactionsSlice'
import Button from '../components/atoms/Button'

export default function Dashboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const repId = useSelector((state) => state.auth.repId)
  const { items, status } = useSelector((state) => state.interactions)

  useEffect(() => {
    if (repId) dispatch(fetchInteractions(repId))
  }, [repId, dispatch])

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Interactions</h1>
          <p className="page-subtitle">Every HCP interaction you've logged, most recent first.</p>
        </div>
        <Button onClick={() => navigate('/log-interaction')}>+ Log Interaction</Button>
      </div>

      <div className="panel">
        {status === 'loading' && (
          <div className="panel-body" style={{ textAlign: 'center' }}>
            <span className="spinner dark" />
          </div>
        )}

        {status === 'succeeded' && items.length === 0 && (
          <div className="empty-state">
            <h3>No interactions logged yet</h3>
            <p>Start by logging your first HCP interaction, via form or chat.</p>
            <Button onClick={() => navigate('/log-interaction')}>+ Log Interaction</Button>
          </div>
        )}

        {items.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Topics</th>
                <th>Sentiment</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} onClick={() => navigate(`/interactions/${item.id}`)}>
                  <td>{item.date}</td>
                  <td>{item.interaction_type}</td>
                  <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.topics_discussed || '—'}
                  </td>
                  <td><span className={`badge ${item.sentiment}`}>{item.sentiment}</span></td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{item.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
