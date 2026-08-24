export const MIN_SONGS = 2
export const MAX_SONGS = 8

export function isMissingSongTitle(song) {
  if (typeof song !== 'string') return true
  const title = song.trim()
  return !title || /^_+$/.test(title)
}

export function getSongTitles(performer, { fallbacks = true, minimumSlots = MIN_SONGS } = {}) {
  const savedSongs = Array.isArray(performer?.song_titles) ? performer.song_titles : []
  const legacySongs = [performer?.song_1_title, performer?.song_2_title]
  const slotCount = Math.min(MAX_SONGS, Math.max(minimumSlots, savedSongs.length, legacySongs.length))

  return Array.from({ length: slotCount }, (_, index) => {
    const savedTitle = savedSongs[index]
    const legacyTitle = legacySongs[index]
    const suppliedTitle = !isMissingSongTitle(savedTitle)
      ? savedTitle.trim()
      : !isMissingSongTitle(legacyTitle) ? legacyTitle.trim() : ''

    return suppliedTitle || (fallbacks ? `Song ${index + 1}` : '')
  })
}

export function normalizeSongTitles(songs) {
  return songs
    .map(song => typeof song === 'string' ? song.trim() : '')
    .filter(song => !isMissingSongTitle(song))
    .slice(0, MAX_SONGS)
}
