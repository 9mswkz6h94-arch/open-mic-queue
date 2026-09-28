import { useState } from 'react'

const GAP_TYPES = [
  ['changeover', 'Changeover'],
  ['host_mc', 'Host / MC'],
  ['technical_delay', 'Technical Delay'],
  ['intermission', 'Intermission'],
  ['unplanned_gap', 'Unplanned Gap'],
]

export default function ProductionTimelineControls({ recording, status, onStartRecording, onStopRecording, onMarker, onDoNotPublish, doNotPublishOpen, onGap, openGap, onResync, onExport, cueCount, currentPerformer, currentSongIndex, currentSongTitle, songCount, onPreviousSong, onNextSong, onEditPerformer, onToggleFeatured, onFinishSet, onDeletePerformer }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [filename, setFilename] = useState('')
  const [note, setNote] = useState('')

  return (
    <section className="production-timeline" aria-label="Recording timeline controls">
      <div className="production-timeline-status">
        <span className="eyebrow">Recording timeline</span>
        <strong>{recording ? `Recording · ${recording.label}` : 'Not recording'}</strong>
        <small className={`timeline-sync timeline-sync-${status}`}>{status === 'saving' ? 'Saving…' : status === 'pending' ? 'Pending sync' : status === 'error' ? 'Sync error' : 'Synced'} · {cueCount} cues</small>
      </div>
      <div className="production-live-set" aria-label="Live song and timeline progression">
        <span className="eyebrow">Live set</span>
        <strong>{currentPerformer?.stage_name || 'Stage open'}</strong>
        <span className="production-live-song">{currentSongTitle ? `${String(currentSongIndex + 1).padStart(2, '0')} · ${currentSongTitle}` : 'No active song'}</span>
        <div className="production-song-actions">
          <button className="btn btn-outline btn-small" disabled={!currentPerformer || currentSongIndex <= 0} onClick={onPreviousSong}>Previous song</button>
          <span>{currentPerformer ? `${currentSongIndex + 1} of ${songCount}` : '—'}</span>
          <button className="btn btn-primary btn-small" disabled={!currentPerformer || currentSongIndex >= songCount - 1} onClick={onNextSong}>Next song + marker</button>
        </div>
        {currentPerformer && <div className="production-performer-actions">
          <button className="btn btn-outline btn-small" onClick={onEditPerformer}>{currentPerformer.entry_role === 'featured_artist' ? 'Edit featured set' : 'Edit performer'}</button>
          <button className="btn btn-outline btn-small" onClick={onToggleFeatured}>{currentPerformer.entry_role === 'featured_artist' ? 'Remove feature' : 'Make featured'}</button>
          <button className="btn btn-primary btn-small" onClick={onFinishSet}>Finish set → next</button>
        </div>}
      </div>
      <div className="production-timeline-primary">
        {!recording ? <button className="btn btn-primary" onClick={() => onStartRecording({ filename })}>Recording Started</button> : <button className="btn btn-outline" onClick={onStopRecording}>Recording Stopped</button>}
        <button className="btn btn-outline" disabled={!recording} onClick={() => onMarker('highlight', note)}>Highlight</button>
        <button className="btn btn-outline" disabled={!recording} onClick={() => onMarker('audio_issue', note)}>Audio Issue</button>
        <button className={`btn ${doNotPublishOpen ? 'btn-primary' : 'btn-outline'}`} disabled={!recording} onClick={() => onDoNotPublish(note)}>{doNotPublishOpen ? 'End Do Not Publish' : 'Do Not Publish'}</button>
        <button className="btn btn-outline" onClick={() => setDetailsOpen(value => !value)} aria-expanded={detailsOpen}>More Timeline Tools</button>
      </div>
      {detailsOpen && <div className="production-timeline-more">
        {!recording && <label>Recording filename (optional)<input value={filename} onChange={event => setFilename(event.target.value)} placeholder="Nelsons_20260927_01.wav" /></label>}
        <label>Marker note (optional)<input value={note} onChange={event => setNote(event.target.value)} maxLength={160} /></label>
        <div className="production-gap-controls">
          {GAP_TYPES.map(([code, label]) => <button key={code} className={`btn btn-small ${openGap === code ? 'btn-primary' : 'btn-outline'}`} disabled={!recording} onClick={() => onGap(code, note)}>{openGap === code ? `End ${label}` : label}</button>)}
          <button className="btn btn-small btn-outline" disabled={!recording} onClick={() => onResync(note)}>Resync Recording</button>
          <button className="btn btn-small btn-outline" disabled={!cueCount} onClick={onExport}>Export Timeline Package</button>
          {currentPerformer && <button className="btn btn-small btn-delete" onClick={onDeletePerformer}>Delete current performer</button>}
        </div>
      </div>}
    </section>
  )
}
