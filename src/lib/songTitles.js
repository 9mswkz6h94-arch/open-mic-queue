export const MIN_SONGS = 2
export const MAX_SONGS = 8

export function getSongTitles(performer) {
  const savedSongs = Array.isArray(performer?.song_titles)
    ? performer.song_titles.filter(song => typeof song === 'string' && song.trim())
    : []

  if (savedSongs.length) return savedSongs

  return [performer?.song_1_title, performer?.song_2_title]
    .filter(song => typeof song === 'string' && song.trim())
}

export function normalizeSongTitles(songs) {
  return songs.map(song => song.trim()).filter(Boolean).slice(0, MAX_SONGS)
}
