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
    const interval = setInterval(fetchPerformers, 5000)
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

  async function moveUp(performerId, currentPos) {
    if (currentPos <= 1) return

    try {
      // Find performer with position above
      const { data: above, error: findError } = await supabase
        .from('performers')
        .select('id')
        .eq('queue_position', currentPos - 1)

      if (above && above.length > 0) {
        // Swap positions
        await supabase
          .from('performers')
          .update({ queue_position: currentPos - 1 })
          .eq('id', performerId)

        await supabase
          .from('performers')
          .update({ queue_position: currentPos })
          .eq('id', above[0].id)

        fetchPerformers()
      }
    } catch (err) {
      setError(err.message)
    }
  }

  async function moveDown(performerId, currentPos) {
    try {
      // Find performer with position below
      const { data: below, error: findError } = await supabase
        .from('performers')
        .select('id')
        .eq('queue_position', currentPos + 1)

      if (below && below.length > 0) {
        // Swap positions
        await supabase
          .from('performers')
          .update({ queue_position: currentPos + 1 })
          .eq('id', performerId)

        await supabase
          .from('performers')
          .update({ queue_position: currentPos })
          .eq('id', below[0].id)

        fetchPerformers()
      }
    } catch (err) {
      setError(err.message)
    }
  }

  async function markAttended(performerId, attended) {
    try {
      await supabase
        .from('performers')
        .update({ attended })
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

  if (loading) return <div className="loading">Loading performers...</div>

  return (
    <div className="admin-page">
      <h2>🎤 Queue Manager (Crystal's Controls)</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="admin-table">
        <div className="table-header">
          <div className="col-status">Status</div>
          <div className="col-name">Performer</div>
          <div className="col-songs">Songs</div>
          <div className="col-actions">Actions</div>
        </div>

        {performers.map((p, idx) => (
          <div key={p.id} className="table-row">
            <div className="col-status">
              {p.current && <span className="badge badge-current">🎤 ON</span>}
              {p.attended === true && <span className="badge badge-attended">✓</span>}
              {p.attended === false && <span className="badge badge-missed">✗</span>}
            </div>

            <div className="col-name">
              <div className="performer-name">
                <strong>{p.stage_name}</strong>
                <small>{p.real_name}</small>
              </div>
            </div>

            <div className="col-songs">
              <small>1. {p.song_1_title}</small>
              <small>2. {p.song_2_title}</small>
            </div>

            <div className="col-actions">
              <button
                onClick={() => markCurrent(p.id)}
                className={`btn ${p.current ? 'btn-active' : 'btn-secondary'}`}
              >
                {p.current ? 'Now Playing' : 'Mark Current'}
              </button>

              <button
                onClick={() => moveUp(p.id, p.queue_position)}
                className="btn btn-small"
                disabled={p.queue_position <= 1}
              >
                ↑
              </button>

              <button
                onClick={() => moveDown(p.id, p.queue_position)}
                className="btn btn-small"
              >
                ↓
              </button>

              <button
                onClick={() => markAttended(p.id, !p.attended)}
                className={`btn btn-small ${p.attended ? 'btn-success' : 'btn-outline'}`}
              >
                {p.attended ? '✓' : '○'}
              </button>

              <button
                onClick={() => deletePerformer(p.id, p.stage_name)}
                className="btn btn-small btn-delete"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-info">
        <p>Total performers: {performers.length}</p>
        <p>Currently on: {performers.find(p => p.current)?.stage_name || 'None'}</p>
      </div>
    </div>
  )
}
