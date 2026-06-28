import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const ADMIN_EMAIL = 'crystal@rainbowheart.studio'

export default function Admin() {
  const { user } = useAuth()
  const [performers, setPerformers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Check if user is admin
  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="admin-page">
        <div className="error-message" style={{ padding: '24px', margin: '24px' }}>
          <h3>Access Denied</h3>
          <p>Only Crystal can access the queue manager.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    fetchPerformers()
    const interval = setInterval(fetchPerformers, 3000)
    return () => clearInterval(interval)
  }, [])

  async function fetchPerformers() {
    const { data, error: err } = await supabase
      .from('performers')
      .select('*')
      .order('queue_position', { ascending: true })

    if (err) {
      setError(err.message)
    } else {
      setPerformers(data || [])
      setLoading(false)
    }
  }

  async function markCurrent(performerId) {
    try {
      // Unmark all
      await supabase
        .from('performers')
        .update({ current: false })
        .neq('id', performerId)

      // Mark this one
      await supabase
        .from('performers')
        .update({ current: true })
        .eq('id', performerId)

      fetchPerformers()
    } catch (err) {
      setError(err.message)
    }
  }

  async function skipPerformer(performerId) {
    try {
      // Mark as attended (performed)
      await supabase
        .from('performers')
        .update({ attended: true, current: false })
        .eq('id', performerId)

      // Mark next performer as current
      const nextPerformer = performers.find(p => !p.attended && p.id !== performerId)
      if (nextPerformer) {
        await supabase
          .from('performers')
          .update({ current: true })
          .eq('id', nextPerformer.id)
      }

      fetchPerformers()
    } catch (err) {
      setError(err.message)
    }
  }

  async function markPerformed(performerId) {
    try {
      await supabase
        .from('performers')
        .update({ attended: true })
        .eq('id', performerId)

      fetchPerformers()
    } catch (err) {
      setError(err.message)
    }
  }

  async function deletePerformer(performerId, stageName) {
    if (!window.confirm(`Delete "${stageName}" from the queue?`)) {
      return
    }

    try {
      await supabase
        .from('performers')
        .delete()
        .eq('id', performerId)

      fetchPerformers()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div className="loading">Loading queue...</div>

  const currentPerformer = performers.find(p => p.current)
  const upcomingPerformers = performers.filter(p => !p.attended && !p.current)
  const completedPerformers = performers.filter(p => p.attended)

  return (
    <div className="admin-page">
      <h2>🎤 Live Queue Manager</h2>

      {error && <div className="error-message">{error}</div>}

      {/* Currently Performing */}
      {currentPerformer ? (
        <div className="queue-progress">
          <div className="current-section">
            <div className="status-label">NOW PERFORMING</div>
            <div className="performer-card current-large">
              <h3>{currentPerformer.stage_name}</h3>
              <p className="real-name">{currentPerformer.real_name}</p>
              <div className="songs-list">
                <p><strong>1.</strong> {currentPerformer.song_1_title}</p>
                <p><strong>2.</strong> {currentPerformer.song_2_title}</p>
              </div>
              <div className="button-group">
                <button
                  onClick={() => skipPerformer(currentPerformer.id)}
                  className="btn btn-primary"
                >
                  Mark Performed → Next
                </button>
                <button
                  onClick={() => deletePerformer(currentPerformer.id, currentPerformer.stage_name)}
                  className="btn btn-delete btn-small"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="queue-progress">
          <div className="current-section empty">
            <p>No performer currently on stage</p>
            {upcomingPerformers.length > 0 && (
              <button
                onClick={() => markCurrent(upcomingPerformers[0].id)}
                className="btn btn-primary"
              >
                Start First Performer
              </button>
            )}
          </div>
        </div>
      )}

      {/* Queue List */}
      <div className="queue-list-admin">
        <h3>📋 Up Next ({upcomingPerformers.length})</h3>
        {upcomingPerformers.length === 0 ? (
          <p className="empty-queue">No more performers in queue</p>
        ) : (
          <div className="queue-items">
            {upcomingPerformers.map((p, idx) => (
              <div key={p.id} className="queue-item">
                <div className="queue-position">#{idx + 1}</div>
                <div className="queue-info">
                  <div className="performer-info">
                    <strong>{p.stage_name}</strong>
                    <small>{p.real_name}</small>
                  </div>
                  <div className="songs-small">
                    {p.song_1_title} / {p.song_2_title}
                  </div>
                </div>
                <div className="queue-actions">
                  <button
                    onClick={() => markCurrent(p.id)}
                    className="btn btn-primary btn-small"
                  >
                    Start
                  </button>
                  <button
                    onClick={() => markPerformed(p.id)}
                    className="btn btn-success btn-small"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => deletePerformer(p.id, p.stage_name)}
                    className="btn btn-delete btn-small"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      {completedPerformers.length > 0 && (
        <div className="queue-list-completed">
          <h3>✓ Already Performed ({completedPerformers.length})</h3>
          <div className="completed-items">
            {completedPerformers.map((p) => (
              <div key={p.id} className="completed-item">
                <span className="check-mark">✓</span>
                <span className="performer-name">{p.stage_name}</span>
                <span className="real-name-small">{p.real_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-info">
        <p>Total in queue: {performers.length}</p>
        <p>Still to go: {upcomingPerformers.length}</p>
      </div>
    </div>
  )
}
