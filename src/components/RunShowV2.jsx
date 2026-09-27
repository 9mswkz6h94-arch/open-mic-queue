import { useEffect, useState } from 'react'
import { getSongTitles } from '../lib/songTitles'
import './RunShowV2.css'

export default function RunShowV2({
  currentPerformer,
  upcomingPerformers,
  completedPerformers,
  currentSongIndex,
  currentSongTitle,
  stageUndo,
  onUndo,
  onQuickSignup,
  quickSignupOpen,
  quickSignupContent,
  tvPreviewUrl,
  onExport,
  onEdit,
  onStart,
  onFinishCurrent,
  onSelectSong,
  onMove,
  productionControls,
}) {
  const [selectedId, setSelectedId] = useState(currentPerformer?.id || upcomingPerformers[0]?.id || null)
  const [drawer, setDrawer] = useState(null)

  useEffect(() => {
    if (currentPerformer?.id) setSelectedId(currentPerformer.id)
  }, [currentPerformer?.id])

  useEffect(() => {
    if (quickSignupOpen) setDrawer('signup')
    else if (drawer === 'signup') setDrawer(null)
  }, [quickSignupOpen])

  const selectedPerformer = [currentPerformer, ...upcomingPerformers, ...completedPerformers]
    .filter(Boolean)
    .find(performer => performer.id === selectedId) || currentPerformer || upcomingPerformers[0]
  const selectedIsCurrent = selectedPerformer?.id === currentPerformer?.id
  const nextPerformer = upcomingPerformers[0]

  function openDrawer(name) {
    setDrawer(name)
    if (name === 'signup' && !quickSignupOpen) onQuickSignup()
  }

  function closeDrawer() {
    if (drawer === 'signup' && quickSignupOpen) onQuickSignup()
    setDrawer(null)
  }

  return (
    <div className="run-show-v2">
      <header className="run-show-strip">
        <div className="run-show-state"><span>Event</span><strong>Live</strong></div>
        <div className="run-show-state is-primary"><span>Now</span><strong>{currentPerformer?.stage_name || 'Stage open'}</strong><small>{currentSongTitle || 'No active song'}</small></div>
        <div className="run-show-state"><span>Next</span><strong>{nextPerformer?.stage_name || 'Queue complete'}</strong></div>
        <div className="run-show-strip-actions">
          {stageUndo && <button className="btn btn-outline btn-small" onClick={onUndo}>Undo</button>}
          <button className="btn btn-primary btn-small" onClick={() => openDrawer('signup')}>Quick Signup</button>
          <button className="btn btn-outline btn-small" onClick={() => openDrawer('tv')}>TV & Messages</button>
        </div>
      </header>

      {productionControls}

      <main className="run-show-workspace">
        <section className="run-show-queue" aria-labelledby="run-show-queue-title">
          <div className="run-show-section-heading">
            <div><span className="eyebrow">Running order</span><h2 id="run-show-queue-title">Up Next</h2></div>
            <strong>{String(upcomingPerformers.length).padStart(2, '0')}</strong>
          </div>
          <div className="run-show-queue-list">
            {upcomingPerformers.length === 0 && <p className="run-show-empty">No performers waiting.</p>}
            {upcomingPerformers.map((performer, index) => (
              <article key={performer.id} className={`run-show-row${selectedId === performer.id ? ' is-selected' : ''}`}>
                <button className="run-show-row-main" onClick={() => setSelectedId(performer.id)} aria-pressed={selectedId === performer.id}>
                  <span className="run-show-position">{String(index + 1).padStart(2, '0')}</span>
                  <span className="run-show-row-copy"><strong>{performer.stage_name}</strong><small>{getSongTitles(performer).join(' / ')}</small></span>
                </button>
                <div className="run-show-row-order" aria-label={`Move ${performer.stage_name} in the queue`}>
                  <button className="btn btn-outline btn-small" disabled={index === 0} onClick={() => onMove(performer.id, -1)} aria-label={`Move ${performer.stage_name} up`}>↑</button>
                  <button className="btn btn-outline btn-small" disabled={index === upcomingPerformers.length - 1} onClick={() => onMove(performer.id, 1)} aria-label={`Move ${performer.stage_name} down`}>↓</button>
                </div>
                <button className="btn btn-primary btn-small" onClick={() => onStart(performer.id)}>Start</button>
              </article>
            ))}
          </div>
        </section>

        <aside className="run-show-detail" aria-label="Performer controls">
          {selectedPerformer ? (
            <>
              <div className="run-show-detail-heading"><span className="eyebrow">{selectedIsCurrent ? 'On stage' : 'Selected performer'}</span><h2>{selectedPerformer.stage_name}</h2><p>{selectedPerformer.real_name}</p></div>
              <div className="run-show-song-list">
                {getSongTitles(selectedPerformer).map((song, index) => selectedIsCurrent ? (
                  <button key={song + index} className={`run-show-song${currentSongIndex === index ? ' is-current' : ''}`} aria-pressed={currentSongIndex === index} onClick={() => onSelectSong(selectedPerformer, index)}><span>{String(index + 1).padStart(2, '0')}</span>{song}</button>
                ) : (
                  <div key={song + index} className="run-show-song"><span>{String(index + 1).padStart(2, '0')}</span>{song}</div>
                ))}
              </div>
              <div className="run-show-detail-actions">
                <button className="btn btn-outline" onClick={() => onEdit(selectedPerformer.id)}>Edit Performer</button>
                {selectedIsCurrent ? <button className="btn btn-primary" onClick={() => onFinishCurrent(selectedPerformer.id)}>Finish Set → Next</button> : <button className="btn btn-primary" onClick={() => onStart(selectedPerformer.id)}>Start Performer</button>}
              </div>
            </>
          ) : <p className="run-show-empty">Select a performer to see their set.</p>}
        </aside>
      </main>

      <footer className="run-show-footer">
        <span><strong>{upcomingPerformers.length + completedPerformers.length + (currentPerformer ? 1 : 0)}</strong> signed up</span>
        <span><strong>{upcomingPerformers.length}</strong> remaining</span>
        <span><strong>{completedPerformers.length}</strong> performed</span>
        <button className="btn btn-outline btn-small" onClick={() => setDrawer('history')}>History & Export</button>
      </footer>

      {drawer && <div className="run-show-drawer-scrim" onMouseDown={event => { if (event.target === event.currentTarget) closeDrawer() }}>
        <aside className="run-show-drawer" aria-label={`${drawer} panel`}>
          <div className="run-show-drawer-heading"><span className="eyebrow">Supporting workspace</span><h2>{drawer === 'signup' ? 'Quick Signup' : drawer === 'tv' ? 'TV & Messages' : 'History & Export'}</h2><button className="btn btn-outline btn-small" onClick={closeDrawer}>Close</button></div>
          {drawer === 'signup' && quickSignupContent}
          {drawer === 'tv' && <div className="run-show-tv-drawer"><iframe src={tvPreviewUrl} title="Venue TV preview" /><a className="btn btn-primary" href={tvPreviewUrl} target="_blank" rel="noreferrer">Open Full TV View</a><p>Announcement and supporter publishing controls will move into this focused workspace after the Run Show layout is approved.</p></div>}
          {drawer === 'history' && <div className="run-show-history"><button className="btn btn-primary" onClick={onExport}>Export Timestamps</button>{completedPerformers.map(performer => <div key={performer.id} className="run-show-history-row"><strong>{performer.stage_name}</strong><span>{performer.completed_at ? new Date(performer.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Completed'}</span></div>)}</div>}
        </aside>
      </div>}
    </div>
  )
}
