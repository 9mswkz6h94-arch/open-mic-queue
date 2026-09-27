const GAP_TYPES = ['changeover', 'host_mc', 'technical_delay', 'intermission', 'unplanned_gap']

export function orderCues(cues) {
  return [...cues].sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0))
}

export function deriveTimelineState(cues) {
  const state = { activeEntryId: null, activeSong: null, openGap: null }
  for (const cue of orderCues(cues)) {
    if (cue.cue_type === 'performer_started') state.activeEntryId = cue.entry_id
    if (cue.cue_type === 'performer_ended' && cue.entry_id === state.activeEntryId) {
      state.activeEntryId = null
      state.activeSong = null
    }
    if (cue.cue_type === 'song_started') {
      state.activeSong = {
        entryId: cue.entry_id,
        songId: cue.song_id,
        position: cue.song_position_snapshot,
        label: cue.song_label_snapshot,
      }
    }
    if (cue.cue_type === 'song_ended' && state.activeSong?.entryId === cue.entry_id && state.activeSong?.position === cue.song_position_snapshot) {
      state.activeSong = null
    }
    for (const type of GAP_TYPES) {
      if (cue.cue_type === `${type}_started`) state.openGap = type
      if (cue.cue_type === `${type}_ended` && state.openGap === type) state.openGap = null
    }
  }
  return state
}
