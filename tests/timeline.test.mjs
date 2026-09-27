import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTimelinePackage, timelineToCsv, timelineToReaperRegionsCsv } from '../src/lib/timelineExports.js'
import { deriveTimelineState } from '../src/lib/timelineState.js'

const event = { id: 'event-1', slug: 'nelsons-2026-09-27', title: "Nelson's Open Mic", timezone: 'America/Chicago' }
const recording = { id: 'recording-1', label: 'Main recording', source_kind: 'reaper_multitrack', started_at: '2026-09-28T04:59:59.500Z', ended_at: '2026-09-28T05:00:03.250Z', filename: 'Nelsons_20260927_01.wav', device_note: null }
const cue = (sequence_number, cue_type, recording_relative_ms, extra = {}) => ({ id: `cue-${sequence_number}`, client_cue_id: `client-${sequence_number}`, sequence_number, cue_type, client_occurred_at: new Date(new Date(recording.started_at).getTime() + recording_relative_ms).toISOString(), server_received_at: new Date(new Date(recording.started_at).getTime() + recording_relative_ms + 20).toISOString(), recording_relative_ms, publication_status: 'internal', ...extra })

test('canonical export stays in UTC across local midnight and preserves millisecond precision', () => {
  const timeline = buildTimelinePackage({ event, recording, cues: [cue(2, 'recording_stopped', 3750), cue(1, 'recording_started', 0)], generatedAt: '2026-09-28T05:01:00.000Z' })
  assert.equal(timeline.cues[1].occurred_at_utc, '2026-09-28T05:00:03.250Z')
  assert.equal(timeline.cues[1].recording_seconds, 3.75)
  assert.equal(timeline.event.timezone, 'America/Chicago')
})

test('exports snapshots without private real-name or contact fields', () => {
  const timeline = buildTimelinePackage({ event, recording, cues: [cue(1, 'performer_started', 500, { entry_id: 'entry-deleted', performer_label_snapshot: 'The Traveling Pines', real_name: 'Private Name', email: 'private@example.test' })] })
  const serialized = JSON.stringify(timeline)
  assert.match(serialized, /The Traveling Pines/)
  assert.doesNotMatch(serialized, /Private Name|private@example\.test/)
  assert.doesNotMatch(timelineToCsv(timeline), /real_name|email/i)
})

test('REAPER convenience CSV pairs song regions and keeps diagnostic markers', () => {
  const cues = [
    cue(1, 'song_started', 1000, { entry_id: 'entry-1', song_id: 'song-1', song_position_snapshot: 1, performer_label_snapshot: 'June Star', song_label_snapshot: 'River Road' }),
    cue(2, 'highlight', 2200, { note: 'Strong chorus' }),
    cue(3, 'song_ended', 4000, { entry_id: 'entry-1', song_id: 'song-1', song_position_snapshot: 1 }),
  ]
  const csv = timelineToReaperRegionsCsv(buildTimelinePackage({ event, recording, cues }))
  assert.match(csv, /REGION.*June Star.*River Road.*1.*4/)
  assert.match(csv, /MARKER.*HIGHLIGHT.*Strong chorus.*2\.2/)
})

test('derived state closes songs and intervals in sequence order', () => {
  const state = deriveTimelineState([
    cue(4, 'technical_delay_ended', 4000),
    cue(1, 'performer_started', 0, { entry_id: 'entry-1' }),
    cue(2, 'song_started', 1000, { entry_id: 'entry-1', song_position_snapshot: 2, song_label_snapshot: 'Second Song' }),
    cue(3, 'technical_delay_started', 2000),
    cue(5, 'song_ended', 5000, { entry_id: 'entry-1', song_position_snapshot: 2 }),
  ])
  assert.equal(state.activeEntryId, 'entry-1')
  assert.equal(state.activeSong, null)
  assert.equal(state.openGap, null)
})

test('correction cues remain append-only and identify the corrected marker', () => {
  const timeline = buildTimelinePackage({ event, recording, cues: [cue(1, 'performer_started', 0), cue(2, 'cue_corrected', 100, { corrects_cue_id: 'cue-1', is_edit_marker: true, note: 'Host undo' })] })
  assert.equal(timeline.cues.length, 2)
  assert.equal(timeline.cues[1].corrects_marker_id, 'cue-1')
  assert.equal(timeline.cues[1].edit_marker, true)
})
