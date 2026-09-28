const GAP_TYPES = ['changeover', 'host_mc', 'technical_delay', 'intermission', 'unplanned_gap']

export function orderCues(cues) {
  return [...cues].sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0))
}

export function deriveTimelineState(cues) {
  const state = { activeEntryId: null, activeSong: null, openGap: null, doNotPublishOpen: false }
  const corrected = new Set(cues.filter(cue => cue.cue_type === 'cue_corrected' && cue.corrects_cue_id).map(cue => cue.corrects_cue_id))
  for (const cue of orderCues(cues)) {
    if (corrected.has(cue.id) || corrected.has(cue.client_cue_id) || cue.cue_type === 'cue_corrected') continue
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
    if (cue.cue_type === 'do_not_publish_started') state.doNotPublishOpen = true
    if (cue.cue_type === 'do_not_publish_ended') state.doNotPublishOpen = false
  }
  return state
}
