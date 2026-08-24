import { useEffect, useRef, useState } from 'react'
import { supabase } from '@dataClient'
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

import { isAdminEmail } from '../lib/admin'
import { getSongTitles } from '../lib/songTitles'
import PageHeader from '../components/PageHeader'
import SignUpForm from '../components/SignUpForm'
import { pathForPage } from '../lib/routes'
import {
  clearDisplayPrompt,
  createDisplayPrompt,
  isMockDisplayPromptChannel,
  isProductionDisplayPromptChannel,
  previewDisplayPrompt,
  publishDisplayPrompt,
} from '../lib/displayPromptChannel'

function SortableRow({ performer, idx, onMarkCurrent, onMarkPerformed, onDelete, onEdit, onToggleFeatured }) {
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
      <div {...attributes} {...listeners} className="drag-handle" title="Drag to reorder" aria-label={`Reorder ${performer.stage_name}`}>
        Move
      </div>
      <div className="queue-position">#{idx + 1}</div>
      <div className="queue-info">
        <div className="performer-info">
          <strong>{performer.stage_name}</strong>
          {performer.entry_role === 'featured_artist' && <span className="featured-artist-badge">Featured Artist</span>}
          <small>{performer.real_name}</small>
        </div>
        <div className="songs-small">
          {getSongTitles(performer).join(' / ')}
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
        <button onClick={() => onEdit(performer.id)} className="btn btn-outline btn-small">
          {performer.entry_role === 'featured_artist' ? 'Edit featured set' : 'Edit'}
        </button>
        <button onClick={() => onToggleFeatured(performer)} className="btn btn-outline btn-small">
          {performer.entry_role === 'featured_artist' ? 'Remove feature' : 'Make featured'}
        </button>
        <button onClick={() => onMarkCurrent(performer.id)} className="btn btn-primary btn-small">
          Start
        </button>
        <button onClick={() => onMarkPerformed(performer.id)} className="btn btn-success btn-small" aria-label={`Mark ${performer.stage_name} performed`}>
          Done
        </button>
        <button onClick={() => onDelete(performer.id, performer.stage_name)} className="btn btn-delete btn-small" aria-label={`Delete ${performer.stage_name}`}>
          Delete
        </button>
      </div>
    </div>
  )
}

export default function Admin({ onEditPerformer, eventSlug }) {
  const { user } = useAuth()
  const [performers, setPerformers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stageUndo, setStageUndo] = useState(null)
  const [isReordering, setIsReordering] = useState(false)
  const [quickSignupOpen, setQuickSignupOpen] = useState(false)
  const [currentSongByPerformer, setCurrentSongByPerformer] = useState({})
  const [songCueLog, setSongCueLog] = useState([])
  const [tvPromptDraft, setTvPromptDraft] = useState(null)
  const [publicPromptType, setPublicPromptType] = useState('announcement')
  const [publicPromptMessage, setPublicPromptMessage] = useState('')
  const [supporterDisplayName, setSupporterDisplayName] = useState('')
  const [supporterDisplayPermission, setSupporterDisplayPermission] = useState(false)
  const [publicPromptState, setPublicPromptState] = useState(null)
  const [publishConfirmed, setPublishConfirmed] = useState(false)
  const [promptDurationMinutes, setPromptDurationMinutes] = useState(5)
  const reorderingRef = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (!isAdminEmail(user?.email)) return undefined
    fetchPerformers()
    const interval = setInterval(fetchPerformers, 3000)
    return () => clearInterval(interval)
  }, [user?.email])

  async function fetchPerformers() {
    if (reorderingRef.current) return
    const { data, error: err } = await supabase
      .from('performers')
      .select('*')
      .order('queue_position', { ascending: true })

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      setPerformers(data || [])
      setLoading(false)
    }
  }

  async function markCurrent(performerId) {
    try {
      setError('')
      const currentPerformer = performers.find(p => p.current)
      const nextPerformer = performers.find(p => p.id === performerId)
      const snapshots = [currentPerformer, nextPerformer]
        .filter(Boolean)
        .filter((performer, index, list) => list.findIndex(item => item.id === performer.id) === index)
        .map(stageSnapshot)

      if (currentPerformer && currentPerformer.id !== performerId) {
        const { error: clearError } = await supabase
          .from('performers')
          .update({ current: false })
          .eq('id', currentPerformer.id)
        if (clearError) throw clearError
      }

      const { error: startError } = await supabase
        .from('performers')
        .update({ current: true, attended: false, started_at: new Date().toISOString(), completed_at: null })
        .eq('id', performerId)
      if (startError) throw startError

      setStageUndo({ label: `starting ${nextPerformer?.stage_name || 'performer'}`, snapshots })
      await fetchPerformers()
    } catch (err) {
      setError(err.message)
    }
  }

  async function skipPerformer(performerId) {
    try {
      setError('')
      const nextPerformer = performers.find(p => !p.attended && !p.current && p.id !== performerId)
      const snapshots = [performers.find(p => p.id === performerId), nextPerformer]
        .filter(Boolean)
        .map(stageSnapshot)

      const { error: completeError } = await supabase
        .from('performers')
        .update({ attended: true, current: false, completed_at: new Date().toISOString() })
        .eq('id', performerId)
      if (completeError) throw completeError

      if (nextPerformer) {
        const { error: nextError } = await supabase
          .from('performers')
          .update({ current: true, attended: false, started_at: new Date().toISOString(), completed_at: null })
          .eq('id', nextPerformer.id)
        if (nextError) throw nextError
      }

      setStageUndo({ label: `advancing past ${snapshots[0]?.stage_name || 'performer'}`, snapshots })
      await fetchPerformers()
    } catch (err) {
      setError(err.message)
    }
  }

  function stageSnapshot(performer) {
    return {
      id: performer.id,
      stage_name: performer.stage_name,
      current: performer.current,
      attended: performer.attended,
      queue_position: performer.queue_position,
      started_at: performer.started_at,
      completed_at: performer.completed_at,
    }
  }

  async function undoLastStageChange() {
    if (!stageUndo) return

    try {
      setError('')
      for (const snapshot of stageUndo.snapshots) {
        const { id, stage_name: _stageName, ...restoredState } = snapshot
        const { error: restoreError } = await supabase
          .from('performers')
          .update(restoredState)
          .eq('id', id)
        if (restoreError) throw restoreError
      }

      setStageUndo(null)
      await fetchPerformers()
    } catch (err) {
      setError(`Could not undo the stage change: ${err.message}`)
    }
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      finishReordering()
      return
    }

    const upcomingPerformers = performers.filter(p => !p.attended && !p.current)
    const oldIndex = upcomingPerformers.findIndex(p => p.id === active.id)
    const newIndex = upcomingPerformers.findIndex(p => p.id === over.id)
    if (oldIndex < 0 || newIndex < 0) {
      finishReordering()
      return
    }

    try {
      setError('')
      const reordered = arrayMove(upcomingPerformers, oldIndex, newIndex)
      const fixedPerformers = performers.filter(p => p.attended || p.current)
      const basePosition = Math.max(0, ...fixedPerformers.map(p => p.queue_position || 0)) + 1
      const positioned = reordered.map((performer, idx) => ({
        ...performer,
        queue_position: basePosition + idx,
      }))

      // Update immediately so the row stays where the host dropped it.
      setPerformers([...fixedPerformers, ...positioned].sort((a, b) => a.queue_position - b.queue_position))

      const results = await Promise.all(
        positioned.map(performer =>
          supabase
            .from('performers')
            .update({ queue_position: performer.queue_position })
            .eq('id', performer.id)
        )
      )
      const saveError = results.find(result => result.error)?.error
      if (saveError) throw saveError

      finishReordering()
      await fetchPerformers()
    } catch (err) {
      finishReordering()
      setError(`Could not save the new queue order: ${err.message}`)
      await fetchPerformers()
    }
  }

  function startReordering() {
    reorderingRef.current = true
    setIsReordering(true)
  }

  function finishReordering() {
    reorderingRef.current = false
    setIsReordering(false)
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

  async function requeuePerformer(performer) {
    try {
      setError('')
      const previousState = stageSnapshot(performer)
      const nextPosition = Math.max(0, ...performers.map(item => item.queue_position || 0)) + 1
      const { error: requeueError } = await supabase
        .from('performers')
        .update({
          attended: false,
          current: false,
          started_at: null,
          completed_at: null,
          queue_position: nextPosition,
        })
        .eq('id', performer.id)

      if (requeueError) throw requeueError
      setStageUndo({ label: `requeueing ${performer.stage_name}`, snapshots: [previousState] })
      await fetchPerformers()
    } catch (err) {
      setError(`Could not requeue ${performer.stage_name}: ${err.message}`)
    }
  }

  async function clearPerformedPerformers() {
    const completedCount = performers.filter(performer => performer.attended).length
    if (!completedCount) return
    if (!window.confirm(`Remove all ${completedCount} performed ${completedCount === 1 ? 'person' : 'people'} from the queue?\n\nUse this at the start of a new event week. This permanently removes those entries.`)) return

    try {
      setError('')
      const { error: clearError } = await supabase
        .from('performers')
        .delete()
        .eq('attended', true)
      if (clearError) throw clearError
      setStageUndo(null)
      await fetchPerformers()
    } catch (err) {
      setError(`Could not clear the performed list: ${err.message}`)
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

  async function toggleFeaturedArtist(performer) {
    try {
      setError('')
      const assigning = performer.entry_role !== 'featured_artist'

      if (assigning) {
        const existingFeatured = performers.filter(item => item.id !== performer.id && item.entry_role === 'featured_artist')
        for (const featured of existingFeatured) {
          const { error: clearError } = await supabase
            .from('performers')
            .update({ entry_role: 'standard' })
            .eq('id', featured.id)
          if (clearError) throw clearError
        }
      }

      const { error: roleError } = await supabase
        .from('performers')
        .update({ entry_role: assigning ? 'featured_artist' : 'standard' })
        .eq('id', performer.id)
      if (roleError) throw roleError

      await fetchPerformers()
    } catch (err) {
      setError(`Could not update Featured Artist: ${err.message}`)
    }
  }

  function selectCurrentSong(performer, songIndex) {
    const songs = getSongTitles(performer)
    const safeIndex = Math.max(0, Math.min(songIndex, songs.length - 1))
    const previousIndex = currentSongByPerformer[performer.id] ?? 0
    if (safeIndex === previousIndex && songCueLog.some(cue => cue.performerId === performer.id && cue.songIndex === safeIndex)) return

    const occurredAt = new Date().toISOString()
    setCurrentSongByPerformer(previous => ({ ...previous, [performer.id]: safeIndex }))
    setSongCueLog(previous => [
      ...previous,
      {
        performerId: performer.id,
        stageName: performer.stage_name,
        songIndex: safeIndex,
        songTitle: songs[safeIndex],
        occurredAt,
      },
    ])
  }

  async function draftPublicPrompt() {
    const content = publicPromptMessage.trim()
    if (!content) {
      setError('Enter the exact public prompt copy before creating a draft.')
      return
    }
    if (publicPromptType === 'supporter_acknowledgement' && !supporterDisplayPermission) {
      setError('Supporter recognition requires confirmed display permission.')
      return
    }
    if (publicPromptType === 'supporter_acknowledgement' && !supporterDisplayName.trim()) {
      setError('Enter the supporter’s exact approved public display name.')
      return
    }
    if (publicPromptType === 'supporter_acknowledgement' && isProductionDisplayPromptChannel()) {
      setError('Production supporter publication remains locked until display prompts are linked to verified supporter consent.')
      return
    }
    try {
      setError('')
      setPublishConfirmed(false)
      const draft = await createDisplayPrompt(eventSlug, performers.find(performer => performer.event_id)?.event_id, {
        type: publicPromptType,
        label: publicPromptType === 'announcement' ? 'Announcement' : 'Supporter acknowledgement',
        region: publicPromptType === 'announcement' ? 'ticker' : 'right_rail',
        content,
        supporterDisplayName: supporterDisplayName.trim(),
        status: 'draft',
      }, user?.id)
      setPublicPromptState(draft)
    } catch (promptError) {
      setError(`Could not create public prompt: ${promptError.message}`)
    }
  }

  async function previewPublicPrompt() {
    if (!publicPromptState) return
    try {
      await previewDisplayPrompt(publicPromptState)
      setPublishConfirmed(false)
      setPublicPromptState(previous => ({ ...previous, status: 'previewed' }))
    } catch (promptError) {
      setError(`Could not preview public prompt: ${promptError.message}`)
    }
  }

  async function publishPublicPrompt() {
    if (!publicPromptState || publicPromptState.status !== 'previewed' || !publishConfirmed) return
    try {
      const prompt = await publishDisplayPrompt(eventSlug, publicPromptState, user?.id, promptDurationMinutes)
      setError('')
      setPublicPromptState(prompt)
      setPublishConfirmed(false)
    } catch (promptError) {
      setError(`Could not publish public prompt: ${promptError.message}`)
    }
  }

  async function endPublicPrompt(status) {
    if (!publicPromptState) return
    try {
      await clearDisplayPrompt(eventSlug, publicPromptState, status)
      setPublicPromptState(previous => previous ? ({ ...previous, status }) : null)
      setPublishConfirmed(false)
      setError('')
    } catch (promptError) {
      setError(`Could not ${status === 'expired' ? 'expire' : 'clear'} public prompt: ${promptError.message}`)
    }
  }

  function exportTimestamps() {
    const rows = [
      ['Position', 'Stage Name', 'Real Name', 'Songs', 'Started', 'Finished', 'Duration (min)'],
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
        getSongTitles(p).join(' | '),
        start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        duration,
      ])
    })

    if (songCueLog.length > 0) {
      rows.push([])
      rows.push(['Song Cues'])
      rows.push(['Stage Name', 'Song Number', 'Song Title', 'Occurred'])
      songCueLog.forEach(cue => {
        rows.push([
          cue.stageName,
          cue.songIndex + 1,
          cue.songTitle,
          new Date(cue.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        ])
      })
    }

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

  if (!isAdminEmail(user?.email)) {
    return (
      <div className="admin-page">
        <div className="error-message" style={{ padding: '24px', margin: '24px' }}>
          <h3>Access Denied</h3>
          <p>This account is not authorized to use the host console.</p>
        </div>
      </div>
    )
  }

  if (loading) return <div className="loading">Loading queue...</div>

  const currentPerformer = performers.find(p => p.current)
  const upcomingPerformers = performers.filter(p => !p.attended && !p.current)
  const completedPerformers = performers.filter(p => p.attended)
  const currentSongIndex = currentPerformer ? (currentSongByPerformer[currentPerformer.id] ?? 0) : 0
  const tvPreviewUrl = `${pathForPage('display', eventSlug)}${window.location.search}`
  const currentSongTitle = currentPerformer ? getSongTitles(currentPerformer)[currentSongIndex] : null
  const tvPromptOptions = [
    {
      type: 'active_song',
      label: 'Active song',
      content: currentPerformer && currentSongTitle ? `${currentPerformer.stage_name} — ${currentSongTitle}` : null,
    },
    {
      type: 'featured_artist',
      label: 'Featured artist',
      content: currentPerformer?.entry_role === 'featured_artist' ? `Featured Artist — ${currentPerformer.stage_name}` : null,
    },
    {
      type: 'support_studio',
      label: 'Support studio',
      content: 'Support Rainbow Heart Studio and help local music keep growing.',
    },
    {
      type: 'signup_open',
      label: 'Signup open',
      content: 'Performer signup is open — scan the Event Home QR to join the queue.',
    },
  ]

  return (
    <div className="admin-page">
      <PageHeader
        className="admin-page-header"
        eyebrow="Event operations"
        title="Host Console"
        titleLevel={2}
        actions={(
          <>
          {stageUndo && (
            <button onClick={undoLastStageChange} className="btn btn-outline btn-small">
              Back: undo {stageUndo.label}
            </button>
          )}
          <button onClick={exportTimestamps} className="btn btn-secondary btn-small">
            Export timestamps
          </button>
          <button
            onClick={() => setQuickSignupOpen(open => !open)}
            className="btn btn-primary btn-small"
            aria-expanded={quickSignupOpen}
            aria-controls="host-quick-signup-panel"
          >
            {quickSignupOpen ? 'Close signup' : 'Quick signup'}
          </button>
          </>
        )}
      />

      {error && <div className="error-message">{error}</div>}

      <section className="host-tv-preview-panel" aria-labelledby="host-tv-preview-title">
        <div className="host-tv-preview-copy">
          <div>
            <span className="eyebrow">Venue display / Live preview</span>
            <h3 id="host-tv-preview-title">TV Preview</h3>
          </div>
          <a href={tvPreviewUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-small">
            Open TV view
          </a>
        </div>
        <div className="host-tv-preview-viewport">
          <iframe
            src={tvPreviewUrl}
            title="Read-only live preview of the venue TV display"
            className="host-tv-preview-frame"
            tabIndex="-1"
          />
          {publicPromptState?.status === 'previewed' && (
            <div className={`host-tv-placement-preview is-${publicPromptState.region}`}>
              <strong>Preview · {publicPromptState.label}</strong>
              <span>{publicPromptState.content}</span>
            </div>
          )}
        </div>
        <div className="host-tv-prompt-controls">
          <span className="eyebrow">Prompt vocabulary / Draft only</span>
          <div className="host-tv-prompt-buttons" role="group" aria-label="Choose a TV prompt draft">
            {tvPromptOptions.map(option => (
              <button
                key={option.type}
                type="button"
                className="btn btn-outline btn-small"
                disabled={!option.content}
                aria-pressed={tvPromptDraft?.type === option.type}
                onClick={() => setTvPromptDraft(option)}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-outline btn-small"
              disabled={!tvPromptDraft}
              onClick={() => setTvPromptDraft(null)}
            >
              Clear draft
            </button>
          </div>
          <div className="host-tv-prompt-draft" role="status" aria-live="polite">
            <strong>{tvPromptDraft ? tvPromptDraft.label : 'No prompt drafted'}</strong>
            <span>{tvPromptDraft ? tvPromptDraft.content : 'Choose a constrained prompt to preview its exact public copy.'}</span>
          </div>
        </div>
        <div className="host-public-prompt-workflow">
          <span className="eyebrow">Public prompt workflow / {isMockDisplayPromptChannel() ? 'Mock-isolated' : 'Live event'}</span>
          <div className="host-public-prompt-grid">
            <div className="form-group">
              <label htmlFor="public-prompt-type">Public prompt type</label>
              <select id="public-prompt-type" value={publicPromptType} onChange={event => {
                setPublicPromptType(event.target.value)
                setPublicPromptState(null)
                setPublishConfirmed(false)
              }}>
                <option value="announcement">Announcement · bottom ticker</option>
                <option value="supporter_acknowledgement" disabled={isProductionDisplayPromptChannel()}>Supporter acknowledgement · right rail{isProductionDisplayPromptChannel() ? ' · pending consent link' : ''}</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="public-prompt-duration">Display duration</label>
              <select id="public-prompt-duration" value={promptDurationMinutes} onChange={event => setPromptDurationMinutes(Number(event.target.value))}>
                <option value="1">1 minute</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            {publicPromptType === 'supporter_acknowledgement' && (
              <>
                <label htmlFor="supporter-display-name">Approved public display name</label>
                <input
                  id="supporter-display-name"
                  value={supporterDisplayName}
                  onChange={event => {
                    setSupporterDisplayName(event.target.value)
                    setPublicPromptState(null)
                    setPublishConfirmed(false)
                    setSupporterDisplayPermission(false)
                  }}
                  maxLength="80"
                  placeholder="Sam"
                />
              </>
            )}
            <label htmlFor="public-prompt-message">Exact public copy</label>
            <textarea
              id="public-prompt-message"
              value={publicPromptMessage}
              onChange={event => {
                setPublicPromptMessage(event.target.value)
                setPublicPromptState(null)
                setPublishConfirmed(false)
              }}
              maxLength="160"
              rows="2"
              placeholder={publicPromptType === 'announcement' ? 'Signup closes in 10 minutes.' : 'Thanks to Sam for supporting local music.'}
            />
            <small>{publicPromptMessage.length}/160 characters</small>
          </div>
          {publicPromptType === 'supporter_acknowledgement' && (
            <label className="host-public-prompt-consent">
              <input type="checkbox" checked={supporterDisplayPermission} onChange={event => setSupporterDisplayPermission(event.target.checked)} />
              Confirm the supporter approved this exact public display name and message.
            </label>
          )}
          <div className="host-public-prompt-actions">
            <button type="button" className="btn btn-outline btn-small" onClick={draftPublicPrompt}>Create draft</button>
            <button type="button" className="btn btn-outline btn-small" disabled={publicPromptState?.status !== 'draft'} onClick={previewPublicPrompt}>Preview placement</button>
          </div>
          {publicPromptState && (
            <div className={`host-public-prompt-state is-${publicPromptState.status}`} role="status" aria-live="polite">
              <strong>{publicPromptState.label} · {publicPromptState.status}</strong>
              <span>{publicPromptState.content}</span>
              {publicPromptState.status === 'previewed' && (
                <label className="host-public-prompt-consent">
                  <input type="checkbox" checked={publishConfirmed} onChange={event => setPublishConfirmed(event.target.checked)} />
                  I reviewed the exact copy and placement and intend to make it public.
                </label>
              )}
              {publicPromptState.status === 'published' && <small>Expires at {new Date(publicPromptState.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>}
            </div>
          )}
          <div className="host-public-prompt-actions">
            <button type="button" className="btn btn-primary btn-small" disabled={publicPromptState?.status !== 'previewed' || !publishConfirmed} onClick={publishPublicPrompt}>Publish to {isMockDisplayPromptChannel() ? 'mock TV' : 'live TV'}</button>
            <button type="button" className="btn btn-outline btn-small" disabled={publicPromptState?.status !== 'published'} onClick={() => endPublicPrompt('expired')}>Expire now</button>
            <button type="button" className="btn btn-delete btn-small" disabled={!publicPromptState || ['cleared', 'expired'].includes(publicPromptState.status)} onClick={() => endPublicPrompt('cleared')}>Clear</button>
          </div>
          <small>{isMockDisplayPromptChannel() ? 'Local fixture channel only. Nothing is sent to Supabase or the production display.' : 'Announcements publish through event-scoped host permissions with expiry and audit. Supporter publication remains locked pending a verified consent link.'}</small>
        </div>
        <small>Constrained prompts above remain draft-only. Public announcements and supporter acknowledgements use the guarded workflow.</small>
      </section>

      {quickSignupOpen && (
        <section id="host-quick-signup-panel" className="host-quick-signup-panel" aria-label="Quick performer signup">
          <SignUpForm
            hostMode
            existingPerformers={performers}
            onSuccess={async () => {
              await fetchPerformers()
              setQuickSignupOpen(false)
            }}
          />
        </section>
      )}

      <div className="host-command-grid">
        <section className="host-command-stage" aria-label="Stage controls">
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
              {currentPerformer.entry_role === 'featured_artist' && <span className="featured-artist-badge">Featured Artist · up to 7 songs</span>}
              <p className="real-name">{currentPerformer.real_name}</p>
              <div className="songs-list host-song-progress" aria-label="Current performer song progression">
                {getSongTitles(currentPerformer).map((song, index) => (
                  <button
                    key={`${currentPerformer.id}-song-${index}`}
                    type="button"
                    className={`host-song-cue${currentSongIndex === index ? ' is-current' : ''}`}
                    aria-pressed={currentSongIndex === index}
                    onClick={() => selectCurrentSong(currentPerformer, index)}
                  >
                    <strong>{index + 1}.</strong> {song}
                  </button>
                ))}
              </div>
              <div className="host-song-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-small"
                  disabled={currentSongIndex === 0}
                  onClick={() => selectCurrentSong(currentPerformer, currentSongIndex - 1)}
                >
                  Previous song
                </button>
                <span className="host-song-counter">Song {currentSongIndex + 1} of {getSongTitles(currentPerformer).length}</span>
                <button
                  type="button"
                  className="btn btn-primary btn-small"
                  disabled={currentSongIndex >= getSongTitles(currentPerformer).length - 1}
                  onClick={() => selectCurrentSong(currentPerformer, currentSongIndex + 1)}
                >
                  Next song
                </button>
              </div>
              <small className="host-song-note">Song changes are included in this session's timestamp export.</small>
              <div className="button-group">
                <button onClick={() => onEditPerformer(currentPerformer.id)} className="btn btn-outline btn-small">
                  {currentPerformer.entry_role === 'featured_artist' ? 'Edit featured set' : 'Edit performer'}
                </button>
                <button onClick={() => toggleFeaturedArtist(currentPerformer)} className="btn btn-outline btn-small">
                  {currentPerformer.entry_role === 'featured_artist' ? 'Remove feature' : 'Make featured'}
                </button>
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
        </section>

        <section className="host-command-queue" aria-label="Upcoming performer queue">
      {/* Drag-and-drop Queue */}
      <div className="queue-list-admin">
        <h3>Up next <span className="section-count">{String(upcomingPerformers.length).padStart(2, '0')}</span></h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Drag the Move handle to reorder. On a touchscreen, press and hold the handle, then drag.
          {isReordering && <strong role="status"> Saving order…</strong>}
        </p>
        {upcomingPerformers.length === 0 ? (
          <p className="empty-queue">No more performers in queue</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={startReordering}
            onDragCancel={finishReordering}
            onDragEnd={handleDragEnd}
          >
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
                    onEdit={onEditPerformer}
                    onToggleFeatured={toggleFeaturedArtist}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
        </section>

        <section className="host-command-history" aria-label="Completed performers and event totals">
      {/* Completed */}
      {completedPerformers.length > 0 && (
        <div className="queue-list-completed">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <h3>Performed <span className="section-count">{String(completedPerformers.length).padStart(2, '0')}</span></h3>
            <button onClick={clearPerformedPerformers} className="btn btn-delete btn-small">
              Clear performed for new week
            </button>
          </div>
          <div className="completed-items">
            {completedPerformers.map(p => (
              <div key={p.id} className="completed-item">
                <span className="check-mark">Done</span>
                <span className="performer-name">{p.stage_name}</span>
                <span className="real-name-small">{p.real_name}</span>
                <button onClick={() => onEditPerformer(p.id)} className="btn btn-outline btn-small">
                  Edit
                </button>
                <button onClick={() => requeuePerformer(p)} className="btn btn-primary btn-small">
                  Requeue
                </button>
                {p.started_at && (
                  <span className="timestamp-display" style={{ marginLeft: 'auto', fontSize: '12px' }}>
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
        </section>
      </div>

      <details className="development-tools">
        <summary>Development tools</summary>
        <p>These controls alter the entire shared queue and are not part of normal event operation.</p>
        <button onClick={resetTestData} className="btn btn-delete btn-small" title="Reset all performers and recreate test data">
          Reset all test data
        </button>
      </details>
    </div>
  )
}
