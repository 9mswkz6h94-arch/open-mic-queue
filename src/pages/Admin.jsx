import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const ADMIN_EMAIL = 'crystal@rainbowheart.studio'

function SortableRow({ performer, idx, onMarkCurrent, onMarkPerformed, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: performer.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="queue-item">
      <div {...attributes} {...listeners} className="drag-handle" title="Drag to reorder">
        ⠿
      </div>
      <div className="queue-position">#{idx + 1}</div>
      <div className="queue-info">
        <div className="performer-info">
          <strong>{performer.stage_name}</strong>
          <small>{performer.real_name}</small>
        </div>
        <div className="songs-small">
          {performer.song_1_title} / {performer.song_2_title}
        </div>
        {performer.started_at && (
          <div className="timestamp-display">
            Started: {new Date(performer.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {performer.completed_at && (
              <> → Done: {new Date(performer.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
            )}
          </div>
        )}
      </div>
      <div className="queue-actions">
        <button onClick={() => onMarkCurrent(performer.id)} className="btn btn-primary btn-small">
          Start
        </button>
        <button onClick={() => onMarkPerformed(performer.id)} className="btn btn-success btn-small">
          ✓
        </button>
        <button onClick={() => onDelete(performer.id, performer.stage_name)} className="btn btn-delete btn-small">
          ✕
        </button>
      </div>
    </div>
  )
}

export default function Admin() {
  const { user } = useAuth()
  const [performers, setPerformers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

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
      const currentPerformer = performers.find(p => p.current)
      if (currentPerformer) {
        await supabase
          .from('performers')
          .update({ current: false, completed_at: new Date().toISOString() })
          .eq('id', currentPerformer.id)
      }

      await supabase
        .from('performers')
        .update({ current: true, started_at: new Date().toISOString() })
        .eq('id', performerId)

      fetchPerformers()
    } catch (err) {
      setError(err.message)
    }
  }

  async function skipPerformer(performerId) {
    try {
      await supabase
        .from('performers')
        .update({ attended: true, current: false, completed_at: new Date().toISOString() })
        .eq('id', performerId)

      const nextPerformer = performers.find(p => !p.attended && p.id !== performerId)
      if (nextPerformer) {
        await supabase
          .from('performers')
          .update({ current: true, started_at: new Date().toISOString() })
          .eq('id', nextPerformer.id)
      }

      fetchPerformers()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const upcomingPerformers = performers.filter(p => !p.attended && !p.current)
    const oldIndex = upcomingPerformers.findIndex(p => p.id === active.id)
    const newIndex = upcomingPerformers.findIndex(p => p.id === over.id)
    const reordered = arrayMove(upcomingPerformers, oldIndex, newIndex)

    // Optimistic UI update
    setPerformers(prev => {
      const others = prev.filter(p => p.attended || p.current)
      return [...others, ...reordered]
    })

    // Persist new positions — give each a unique sequential value
    const currentPerformer = performers.find(p => p.current)
    const basePosition = currentPerformer
      ? currentPerformer.queue_position + 1
      : 1

    await Promise.all(
      reordered.map((p, idx) =>
        supabase
          .from('performers')
          .update({ queue_position: basePosition + idx })
          .eq('id', p.id)
      )
    )
  }

  async function markPerformed(performerId) {
    try {
      await supabase
        .from('performers')
        .update({ attended: true, completed_at: new Date().toISOString() })
        .eq('id', performerId)
      fetchPerformers()
    } catch (err) {
      setError(err.message)
    }
  }

  async function deletePerformer(performerId, stageName) {
    if (!window.confirm(`Delete "${stageName}" from the queue?`)) return
    try {
      await supabase.from('performers').delete().eq('id', performerId)
      fetchPerformers()
    } catch (err) {
      setError(err.message)
    }
  }

  function exportTimestamps() {
    const rows = [
      ['Position', 'Stage Name', 'Real Name', 'Song 1', 'Song 2', 'Started', 'Finished', 'Duration (min)'],
    ]

    const allPerformers = [...performers].sort((a, b) => a.queue_position - b.queue_position)

    allPerformers.forEach((p, idx) => {
      const start = p.started_at ? new Date(p.started_at) : null
      const end = p.completed_at ? new Date(p.completed_at) : null
      const duration =
        start && end ? ((end - start) / 60000).toFixed(1) : ''

      rows.push([
        idx + 1,
        p.stage_name,
        p.real_name,
        p.song_1_title,
        p.song_2_title,
        start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        duration,
      ])
    })

    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `show-timestamps-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function resetTestData() {
    const confirmed = window.confirm(
      'Delete ALL performers and recreate 5 test performers?\n\nThis will:\n✓ Remove everyone from the queue\n✓ Add back test performers\n\nContinue?'
    )
    if (!confirmed) return

    try {
      setLoading(true)
      setError('')

      const { error: deleteError } = await supabase
        .from('performers')
        .delete()
        .gt('queue_position', 0)

      if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`)

      const testPerformers = [
        {
          stage_name: 'Neon Dreams', real_name: 'Alex Chen', email: 'alex.test@example.com',
          song_1_title: 'Midnight Echo', song_2_title: 'Electric Soul',
          social_links: { instagram: 'https://instagram.com/neondreams', spotify: 'https://spotify.com/artist/neondreams' },
          queue_position: 1, current: false, attended: false,
          original_confirmed: true, livestream_confirmed: true, radio_featured_confirmed: true, email_opt_in: true,
        },
        {
          stage_name: 'Velvet Voice', real_name: 'Maya Rodriguez', email: 'maya.test@example.com',
          song_1_title: 'Whispered Truths', song_2_title: 'Dancing Through Rain',
          social_links: { tiktok: 'https://tiktok.com/@velvetvoice', youtube: 'https://youtube.com/@velvetvoice' },
          queue_position: 2, current: false, attended: false,
          original_confirmed: true, livestream_confirmed: true, radio_featured_confirmed: true, email_opt_in: false,
        },
        {
          stage_name: 'Echo Box', real_name: 'Jordan Smith', email: 'jordan.test@example.com',
          song_1_title: 'Reverb Rising', song_2_title: 'Sound Wave Surfer',
          social_links: { bandcamp: 'https://echobox.bandcamp.com', website: 'https://echoboxmusic.com' },
          queue_position: 3, current: false, attended: false,
          original_confirmed: true, livestream_confirmed: true, radio_featured_confirmed: true, email_opt_in: true,
        },
        {
          stage_name: 'Luna Tides', real_name: 'Sam Wilson', email: 'sam.test@example.com',
          song_1_title: 'Ocean Blue Dreams', song_2_title: 'Moonlight Path',
          social_links: { instagram: 'https://instagram.com/lunatides' },
          queue_position: 4, current: false, attended: false,
          original_confirmed: true, livestream_confirmed: true, radio_featured_confirmed: true, email_opt_in: false,
        },
        {
          stage_name: 'Sonic Rebellion', real_name: 'Casey Parker', email: 'casey.test@example.com',
          song_1_title: 'Break the Silence', song_2_title: 'Rebel Heart Anthem',
          social_links: { soundcloud: 'https://soundcloud.com/sonicrebellion' },
          queue_position: 5, current: false, attended: false,
          original_confirmed: true, livestream_confirmed: true, radio_featured_confirmed: true, email_opt_in: true,
        },
      ]

      const { error: insertError } = await supabase.from('performers').insert(testPerformers)
      if (insertError) throw new Error(`Insert failed: ${insertError.message}`)

      await fetchPerformers()
      setLoading(false)
    } catch (err) {
      console.error('Reset error:', err)
      setError(`❌ Reset failed: ${err.message}`)
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading queue...</div>

  const currentPerformer = performers.find(p => p.current)
  const upcomingPerformers = performers.filter(p => !p.attended && !p.current)
  const completedPerformers = performers.filter(p => p.attended)

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2>🎤 Live Queue Manager</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={exportTimestamps} className="btn btn-secondary btn-small">
            📥 Export Timestamps
          </button>
          <button onClick={resetTestData} className="btn btn-secondary btn-small" title="Reset all performers and recreate test data">
            🔄 Reset Test Data
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Currently Performing */}
      {currentPerformer ? (
        <div className="queue-progress">
          <div className="current-section">
            <div className="status-label">NOW PERFORMING</div>
            {currentPerformer.started_at && (
              <div className="timestamp-display" style={{ marginBottom: '8px' }}>
                Started at {new Date(currentPerformer.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            <div className="performer-card current-large">
              {currentPerformer.profile_picture_url && (
                <img
                  src={currentPerformer.profile_picture_url}
                  alt={currentPerformer.stage_name}
                  style={{ width: '100px', height: '100px', borderRadius: '8px', objectFit: 'cover', marginBottom: '16px', border: '3px solid rgba(255,255,255,0.2)' }}
                />
              )}
              <h3>{currentPerformer.stage_name}</h3>
              <p className="real-name">{currentPerformer.real_name}</p>
              <div className="songs-list">
                <p><strong>1.</strong> {currentPerformer.song_1_title}</p>
                <p><strong>2.</strong> {currentPerformer.song_2_title}</p>
              </div>
              <div className="button-group">
                <button onClick={() => skipPerformer(currentPerformer.id)} className="btn btn-primary">
                  Mark Performed → Next
                </button>
                <button onClick={() => deletePerformer(currentPerformer.id, currentPerformer.stage_name)} className="btn btn-delete btn-small">
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
              <button onClick={() => markCurrent(upcomingPerformers[0].id)} className="btn btn-primary" style={{ marginTop: '12px' }}>
                Start First Performer
              </button>
            )}
          </div>
        </div>
      )}

      {/* Drag-and-drop Queue */}
      <div className="queue-list-admin">
        <h3>📋 Up Next ({upcomingPerformers.length})</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Drag ⠿ to reorder
        </p>
        {upcomingPerformers.length === 0 ? (
          <p className="empty-queue">No more performers in queue</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={upcomingPerformers.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className="queue-items">
                {upcomingPerformers.map((p, idx) => (
                  <SortableRow
                    key={p.id}
                    performer={p}
                    idx={idx}
                    onMarkCurrent={markCurrent}
                    onMarkPerformed={markPerformed}
                    onDelete={deletePerformer}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Completed */}
      {completedPerformers.length > 0 && (
        <div className="queue-list-completed">
          <h3>✓ Already Performed ({completedPerformers.length})</h3>
          <div className="completed-items">
            {completedPerformers.map(p => (
              <div key={p.id} className="completed-item">
                <span className="check-mark">✓</span>
                <span className="performer-name">{p.stage_name}</span>
                <span className="real-name-small">{p.real_name}</span>
                {p.started_at && (
                  <span className="timestamp-display" style={{ marginLeft: 'auto', fontSize: '11px' }}>
                    {new Date(p.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {p.completed_at && (
                      <> – {new Date(p.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-info">
        <p>Total in queue: {performers.length}</p>
        <p>Still to go: {upcomingPerformers.length}</p>
        <p>Performed: {completedPerformers.length}</p>
      </div>
    </div>
  )
}
