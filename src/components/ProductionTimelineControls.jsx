import { useState } from 'react'

const GAP_TYPES = [
  ['changeover', 'Changeover'],
  ['host_mc', 'Host / MC'],
  ['technical_delay', 'Technical Delay'],
  ['intermission', 'Intermission'],
  ['unplanned_gap', 'Unplanned Gap'],
]

export default function ProductionTimelineControls({ recording, status, onStartRecording, onStopRecording, onMarker, onGap, openGap, onResync, onExport, cueCount }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [filename, setFilename] = useState('')
  const [note, setNote] = useState('')

  return (
    <section className="production-timeline" aria-label="Recording timeline controls">
      <div className="production-timeline-status">
        <span className="eyebrow">Recording timeline</span>
        <strong>{recording ? `Recording · ${recording.label}` : 'Not recording'}</strong>
        <small className={`timeline-sync timeline-sync-${status}`}>{status === 'saving' ? 'Saving…' : status === 'error' ? 'Sync error' : 'Synced'} · {cueCount} cues</small>
      </div>
      <div className="production-timeline-primary">
        {!recording ? <button className="btn btn-primary" onClick={() => onStartRecording({ filename })}>Recording Started</button> : <button className="btn btn-outline" onClick={onStopRecording}>Recording Stopped</button>}
        <button className="btn btn-outline" disabled={!recording} onClick={() => onMarker('highlight', note)}>Highlight</button>
        <button className="btn btn-outline" disabled={!recording} onClick={() => onMarker('audio_issue', note)}>Audio Issue</button>
        <button className="btn btn-outline" disabled={!recording} onClick={() => onMarker('do_not_publish_started', note, 'do_not_publish')}>Do Not Publish</button>
        <button className="btn btn-outline" onClick={() => setDetailsOpen(value => !value)} aria-expanded={detailsOpen}>More Timeline Tools</button>
      </div>
      {detailsOpen && <div className="production-timeline-more">
        {!recording && <label>Recording filename (optional)<input value={filename} onChange={event => setFilename(event.target.value)} placeholder="Nelsons_20260927_01.wav" /></label>}
        <label>Marker note (optional)<input value={note} onChange={event => setNote(event.target.value)} maxLength={160} /></label>
        <div className="production-gap-controls">
          {GAP_TYPES.map(([code, label]) => <button key={code} className={`btn btn-small ${openGap === code ? 'btn-primary' : 'btn-outline'}`} disabled={!recording} onClick={() => onGap(code, note)}>{openGap === code ? `End ${label}` : label}</button>)}
          <button className="btn btn-small btn-outline" disabled={!recording} onClick={() => onResync(note)}>Resync Recording</button>
          <button className="btn btn-small btn-outline" disabled={!cueCount} onClick={onExport}>Export Timeline Package</button>
        </div>
      </div>}
    </section>
  )
}
