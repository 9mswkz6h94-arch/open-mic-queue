import { useState } from 'react'

const GAP_TYPES = [
  ['changeover', 'Changeover'],
  ['host_mc', 'Host / MC'],
  ['technical_delay', 'Technical delay'],
  ['intermission', 'Intermission'],
  ['unplanned_gap', 'Unplanned gap'],
]

export default function ProductionTimelineControls({ recording, status, onStartRecording, onStopRecording, onMarker, onDoNotPublish, doNotPublishOpen, onGap, openGap, onResync, onExport, cueCount, currentPerformer, currentSongIndex, currentSongTitle, songCount, onPreviousSong, onNextSong, onEditPerformer, onToggleFeatured, onFinishSet, onDeletePerformer }) {
  const [filename, setFilename] = useState('')
  const [note, setNote] = useState('')
  const [selectedGap, setSelectedGap] = useState('changeover')
  const activeGapLabel = GAP_TYPES.find(([code]) => code === openGap)?.[1]

  return (
    <section className="production-timeline production-button-board" aria-label="Recording timeline controls">
      <header className="production-board-status">
        <div className="production-timeline-status">
          <span className="eyebrow">Show timeline</span>
          <strong>{recording ? `Recording · ${recording.label}` : 'Ready to record'}</strong>
          <small className={`timeline-sync timeline-sync-${status}`}>{status === 'saving' ? 'Saving…' : status === 'pending' ? 'Pending sync' : status === 'error' ? 'Sync error' : 'Synced'} · {cueCount} cues</small>
        </div>
        <div className="production-board-live" aria-label="Current performer and song">
          <span className="eyebrow">On stage</span>
          <strong>{currentPerformer?.stage_name || 'Stage open'}</strong>
          <span className="production-live-song">{currentSongTitle ? `${String(currentSongIndex + 1).padStart(2, '0')} · ${currentSongTitle} · ${currentSongIndex + 1} of ${songCount}` : 'No active song'}</span>
        </div>
        <label className="production-board-note">
          <span>Marker note (optional)</span>
          <input value={note} onChange={event => setNote(event.target.value)} maxLength={160} placeholder="Add context before pressing a marker" />
        </label>
        {!recording && <label className="production-board-filename">
          <span>Recording filename (optional)</span>
          <input value={filename} onChange={event => setFilename(event.target.value)} placeholder="Nelsons_20260927_01.wav" />
        </label>}
        {!recording
          ? <button className="btn btn-primary production-record-button" onClick={() => onStartRecording({ filename })}>Start recording</button>
          : <button className="btn btn-outline production-record-button" onClick={onStopRecording}>Stop recording</button>}
      </header>

      <div className="production-board-buttons" aria-label="Live show button board">
        <button className="btn btn-outline btn-small" disabled={!currentPerformer || currentSongIndex <= 0} onClick={onPreviousSong}>Previous song</button>
        <button className="btn btn-primary btn-small production-board-next" disabled={!currentPerformer || currentSongIndex >= songCount - 1} onClick={onNextSong}>Next song + marker</button>
        <button className="btn btn-primary btn-small" disabled={!currentPerformer} onClick={onFinishSet}>Finish set → next</button>
        <button className="btn btn-outline btn-small" disabled={!recording} onClick={() => onMarker('highlight', note)}>Highlight</button>
        <button className="btn btn-outline btn-small" disabled={!recording} onClick={() => onMarker('audio_issue', note)}>Audio issue</button>
        <button className={`btn btn-small ${doNotPublishOpen ? 'btn-primary' : 'btn-outline'}`} disabled={!recording} onClick={() => onDoNotPublish(note)}>{doNotPublishOpen ? 'End do not publish' : 'Do not publish'}</button>
        <label className="production-gap-selector">
          <span>Room status</span>
          <select value={openGap || selectedGap} disabled={!recording || Boolean(openGap)} onChange={event => setSelectedGap(event.target.value)}>
            {GAP_TYPES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
        </label>
        <button className={`btn btn-small ${openGap ? 'btn-primary' : 'btn-outline'}`} disabled={!recording} onClick={() => onGap(openGap || selectedGap, note)}>{openGap ? `End ${activeGapLabel}` : 'Start room status'}</button>
        <button className="btn btn-small btn-outline" disabled={!currentPerformer} onClick={onEditPerformer}>{currentPerformer?.entry_role === 'featured_artist' ? 'Edit featured set' : 'Edit performer'}</button>
        <button className="btn btn-small btn-outline" disabled={!currentPerformer} onClick={onToggleFeatured}>{currentPerformer?.entry_role === 'featured_artist' ? 'Remove feature' : 'Make featured'}</button>
        <button className="btn btn-small btn-outline" disabled={!cueCount} onClick={onExport}>Export timeline</button>
        <button className="btn btn-small btn-outline" disabled={!recording} onClick={() => onResync(note)}>Resync recording</button>
        <button className="btn btn-small btn-delete" disabled={!currentPerformer} onClick={onDeletePerformer}>Delete performer</button>
      </div>
    </section>
  )
}
