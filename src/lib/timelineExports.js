export const TIMELINE_SCHEMA_VERSION = '1.0.0'

function csvCell(value) {
  if (value === null || value === undefined) return '""'
  return `"${String(value).replaceAll('"', '""')}"`
}

function cueExport(cue) {
  return {
    marker_id: cue.id,
    client_cue_id: cue.client_cue_id,
    sequence_number: cue.sequence_number,
    cue_type: cue.cue_type,
    occurred_at_utc: cue.client_occurred_at || cue.occurred_at,
    server_received_at_utc: cue.server_received_at,
    recording_seconds: cue.recording_relative_ms === null || cue.recording_relative_ms === undefined
      ? null
      : Number((cue.recording_relative_ms / 1000).toFixed(3)),
    performer_id: cue.entry_id,
    performer_stage_name: cue.performer_label_snapshot,
    song_id: cue.song_id,
    song_index: cue.song_position_snapshot,
    song_title: cue.song_label_snapshot,
    note: cue.note,
    edit_marker: Boolean(cue.is_edit_marker),
    publication_status: cue.publication_status,
    corrects_marker_id: cue.corrects_cue_id,
  }
}

export function buildTimelinePackage({ event, recording, cues, generatedAt = new Date().toISOString() }) {
  const ordered = [...cues].sort((a, b) => a.sequence_number - b.sequence_number)
  return {
    schema_version: TIMELINE_SCHEMA_VERSION,
    generated_at_utc: generatedAt,
    event: { id: event.id, slug: event.slug, title: event.title, timezone: event.timezone },
    recording: recording ? {
      id: recording.id,
      label: recording.label,
      source_kind: recording.source_kind,
      started_at_utc: recording.started_at,
      ended_at_utc: recording.ended_at,
      filename: recording.filename,
      device_note: recording.device_note,
    } : null,
    cues: ordered.map(cueExport),
  }
}

export function timelineToCsv(timeline) {
  const headers = ['schema_version','sequence_number','marker_id','client_cue_id','cue_type','occurred_at_utc','server_received_at_utc','event_timezone','recording_id','recording_seconds','performer_id','performer_stage_name','song_id','song_index','song_title','note','edit_marker','publication_status','corrects_marker_id']
  const rows = timeline.cues.map(cue => [timeline.schema_version,cue.sequence_number,cue.marker_id,cue.client_cue_id,cue.cue_type,cue.occurred_at_utc,cue.server_received_at_utc,timeline.event.timezone,timeline.recording?.id,cue.recording_seconds,cue.performer_id,cue.performer_stage_name,cue.song_id,cue.song_index,cue.song_title,cue.note,cue.edit_marker,cue.publication_status,cue.corrects_marker_id])
  return [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

export function timelineToReaperRegionsCsv(timeline) {
  const rows = [['kind','name','start_seconds','end_seconds','color','cue_id','performer_id','song_id']]
  const openSongs = new Map()
  for (const cue of timeline.cues) {
    const key = `${cue.performer_id || ''}:${cue.song_id || cue.song_index || ''}`
    if (cue.cue_type === 'song_started') openSongs.set(key, cue)
    if (cue.cue_type === 'song_ended' && openSongs.has(key)) {
      const start = openSongs.get(key)
      rows.push(['REGION', `SONG ${String(start.song_index || '').padStart(2, '0')} — ${start.performer_stage_name || 'Performer'} — ${start.song_title || `Song ${start.song_index}`}`, start.recording_seconds, cue.recording_seconds, '', start.marker_id, start.performer_id, start.song_id])
      openSongs.delete(key)
    }
    if (['highlight','audio_issue','recording_resynced'].includes(cue.cue_type)) {
      rows.push(['MARKER', `${cue.cue_type.toUpperCase()}${cue.note ? ` — ${cue.note}` : ''}`, cue.recording_seconds, '', '', cue.marker_id, cue.performer_id, cue.song_id])
    }
  }
  return rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

export function downloadTimelinePackage({ event, recording, cues }) {
  const timeline = buildTimelinePackage({ event, recording, cues })
  const base = `${event.slug}_${recording?.id || 'no-recording'}`
  const files = [
    [`${base}_event-timeline.json`, JSON.stringify(timeline, null, 2) + '\n', 'application/json;charset=utf-8'],
    [`${base}_event-timeline.csv`, timelineToCsv(timeline), 'text/csv;charset=utf-8'],
    [`${base}_reaper-regions.csv`, timelineToReaperRegionsCsv(timeline), 'text/csv;charset=utf-8'],
  ]
  for (const [name, contents, type] of files) {
    const url = URL.createObjectURL(new Blob([contents], { type }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = name
    anchor.click()
    URL.revokeObjectURL(url)
  }
}
