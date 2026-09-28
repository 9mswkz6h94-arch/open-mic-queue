import { isMockMode, supabase } from '@dataClient'
import { indexedDbOutbox, outboxItem, replayOutbox } from './timelineOutbox'

const MOCK_KEY = 'open-mic-queue:mock-timeline:v1'

function isRetryableTransportError(error) {
  const message = String(error?.message || error).toLowerCase()
  return error instanceof TypeError || /failed to fetch|network|timeout|load failed|connection/.test(message) || [0, 502, 503, 504].includes(error?.status)
}

function mockRead() {
  return JSON.parse(localStorage.getItem(MOCK_KEY) || '{"recordings":[],"cues":[]}')
}

function mockWrite(value) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(value))
}

export async function loadTimeline(eventId) {
  if (isMockMode) {
    const data = mockRead()
    return { recordings: data.recordings.filter(row => row.event_id === eventId), cues: data.cues.filter(row => row.event_id === eventId) }
  }
  const replay = await replayTimelineOutbox()
  const [recordingsResult, cuesResult] = await Promise.all([
    supabase.from('recording_sessions').select('*').eq('event_id', eventId).order('started_at', { ascending: true }),
    supabase.from('production_cues').select('*').eq('event_id', eventId).order('sequence_number', { ascending: true }),
  ])
  if (recordingsResult.error) throw recordingsResult.error
  if (cuesResult.error) throw cuesResult.error
  return { recordings: recordingsResult.data || [], cues: cuesResult.data || [], pendingCount: replay.pending, replayErrors: replay.errors }
}

async function sendCueRpc(input) {
  const { data, error } = await supabase.rpc('host_record_timeline_cue', { p_event_id: input.eventId, p_client_cue_id: input.clientCueId, p_cue_type: input.cueType, p_occurred_at: input.occurredAt, p_recording_session_id: input.recordingSessionId || null, p_entry_id: input.entryId || null, p_song_id: input.songId || null, p_song_position: input.songPosition || null, p_performer_label: input.performerLabel || null, p_song_label: input.songLabel || null, p_note: input.note || null, p_is_edit_marker: Boolean(input.isEditMarker), p_publication_status: input.publicationStatus || 'internal', p_corrects_cue_id: input.correctsCueId || null, p_metadata: input.metadata || {} })
  if (error) throw error
  return data
}

export async function replayTimelineOutbox() {
  if (isMockMode || typeof indexedDB === 'undefined') return { sent: 0, pending: 0, errors: [] }
  return replayOutbox(indexedDbOutbox, async payload => {
    if (payload.operation === 'transition') return sendTransitionRpc(payload)
    if (payload.operation === 'undo') return sendUndoRpc(payload)
    return sendCueRpc(payload)
  })
}

export async function startRecording({ event, label, filename, deviceNote, occurredAt = new Date().toISOString(), clientCueId = crypto.randomUUID() }) {
  if (isMockMode) {
    const data = mockRead()
    const existingCue = data.cues.find(row => row.client_cue_id === clientCueId)
    if (existingCue) return { recording: data.recordings.find(row => row.id === existingCue.recording_session_id), cue: existingCue }
    if (data.recordings.some(row => row.event_id === event.id && !row.ended_at)) throw new Error('An active recording session already exists for this event')
    const recording = { id: crypto.randomUUID(), event_id: event.id, label, source_kind: 'reaper_multitrack', started_at: occurredAt, ended_at: null, timezone_snapshot: event.timezone, filename, device_note: deviceNote }
    const cue = { id: clientCueId, client_cue_id: clientCueId, event_id: event.id, recording_session_id: recording.id, sequence_number: data.cues.filter(row => row.event_id === event.id).length + 1, cue_type: 'recording_started', occurred_at: occurredAt, client_occurred_at: occurredAt, server_received_at: occurredAt, recording_relative_ms: 0, publication_status: 'internal' }
    data.recordings.push(recording); data.cues.push(cue); mockWrite(data)
    return { recording, cue }
  }
  const { data, error } = await supabase.rpc('host_start_recording_session', { p_event_id: event.id, p_client_cue_id: clientCueId, p_started_at: occurredAt, p_timezone: event.timezone, p_label: label, p_filename: filename || null, p_device_note: deviceNote || null })
  if (error) throw error
  return data
}

export async function recordCue(input) {
  const clientCueId = input.clientCueId || crypto.randomUUID()
  const occurredAt = input.occurredAt || new Date().toISOString()
  if (isMockMode) {
    const data = mockRead()
    const recording = data.recordings.find(row => row.id === input.recordingSessionId)
    const cue = { id: clientCueId, client_cue_id: clientCueId, event_id: input.eventId, recording_session_id: input.recordingSessionId, sequence_number: data.cues.filter(row => row.event_id === input.eventId).length + 1, cue_type: input.cueType, occurred_at: occurredAt, client_occurred_at: occurredAt, server_received_at: occurredAt, recording_relative_ms: recording ? Math.max(0, new Date(occurredAt) - new Date(recording.started_at)) : null, entry_id: input.entryId || null, song_id: input.songId || null, performer_label_snapshot: input.performerLabel || null, song_position_snapshot: input.songPosition || null, song_label_snapshot: input.songLabel || null, note: input.note || null, is_edit_marker: Boolean(input.isEditMarker), publication_status: input.publicationStatus || 'internal', corrects_cue_id: input.correctsCueId || null }
    if (!data.cues.some(row => row.client_cue_id === clientCueId)) {
      data.cues.push(cue)
      if (input.cueType === 'recording_stopped' && recording) recording.ended_at = occurredAt
    }
    mockWrite(data)
    return cue
  }
  const payload = { ...input, clientCueId, occurredAt }
  try {
    return await sendCueRpc(payload)
  } catch (error) {
    if (typeof indexedDB === 'undefined' || !isRetryableTransportError(error)) throw error
    await indexedDbOutbox.put(outboxItem(payload))
    return { id: clientCueId, client_cue_id: clientCueId, event_id: input.eventId, recording_session_id: input.recordingSessionId || null, cue_type: input.cueType, client_occurred_at: occurredAt, occurred_at: occurredAt, performer_label_snapshot: input.performerLabel || null, song_position_snapshot: input.songPosition || null, song_label_snapshot: input.songLabel || null, note: input.note || null, publication_status: input.publicationStatus || 'internal', pending_sync: true }
  }
}

export async function applyShowTransition(input) {
  const payload = { ...input, operation: 'transition', outboxId: input.outboxId || crypto.randomUUID(), occurredAt: input.occurredAt || new Date().toISOString(), cueIds: input.cueIds || {} }
  try {
    return await sendTransitionRpc(payload)
  } catch (error) {
    if (typeof indexedDB === 'undefined' || !isRetryableTransportError(error)) throw error
    await indexedDbOutbox.put(outboxItem(payload))
    return { cues: [], pending_sync: true }
  }
}

async function sendTransitionRpc(input) {
  const { data, error } = await supabase.rpc('host_apply_show_transition', {
    p_event_id: input.eventId, p_transition: input.transition, p_occurred_at: input.occurredAt,
    p_recording_session_id: input.recordingSessionId || null, p_entry_id: input.entryId || null,
    p_next_entry_id: input.nextEntryId || null, p_song_id: input.songId || null, p_song_position: input.songPosition || null,
    p_song_label: input.songLabel || null, p_interval_type: input.intervalType || null, p_note: input.note || null, p_cue_ids: input.cueIds,
  })
  if (error) throw error
  return data
}

export async function undoShowTransition(input) {
  const payload = { ...input, operation: 'undo', outboxId: input.outboxId || crypto.randomUUID(), occurredAt: input.occurredAt || new Date().toISOString() }
  try {
    return await sendUndoRpc(payload)
  } catch (error) {
    if (typeof indexedDB === 'undefined' || !isRetryableTransportError(error)) throw error
    await indexedDbOutbox.put(outboxItem(payload))
    return { pending_sync: true }
  }
}

async function sendUndoRpc(input) {
  const { data, error } = await supabase.rpc('host_undo_show_transition', {
    p_event_id: input.eventId,
    p_occurred_at: input.occurredAt,
    p_corrections: input.corrections || [],
    p_snapshots: input.snapshots,
    p_note: input.note || null,
  })
  if (error) throw error
  return data
}
