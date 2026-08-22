import { MAX_SONGS, MIN_SONGS } from '../lib/songTitles'

export default function SongFields({ songs, onChange, idPrefix }) {
  function updateSong(index, value) {
    onChange(songs.map((song, songIndex) => songIndex === index ? value : song))
  }

  function addSong() {
    if (songs.length < MAX_SONGS) onChange([...songs, ''])
  }

  function removeSong(index) {
    if (songs.length > MIN_SONGS) onChange(songs.filter((_, songIndex) => songIndex !== index))
  }

  return (
    <div className="song-fields">
      {songs.map((song, index) => (
        <div className="form-group" key={`${idPrefix}-${index}`}>
          <label htmlFor={`${idPrefix}-${index}`}>Song {index + 1} Title {index < MIN_SONGS ? '*' : '(optional)'}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              id={`${idPrefix}-${index}`}
              type="text"
              value={song}
              onChange={(event) => updateSong(index, event.target.value)}
              required={index < MIN_SONGS}
              placeholder={index < MIN_SONGS ? `Song ${index + 1} you'll perform` : 'Additional featured-set song'}
            />
            {index >= MIN_SONGS && (
              <button type="button" className="btn btn-outline btn-small" onClick={() => removeSong(index)}>
                Remove
              </button>
            )}
          </div>
        </div>
      ))}

      {songs.length < MAX_SONGS && (
        <button type="button" className="btn btn-outline btn-small" onClick={addSong}>
          Add another song
        </button>
      )}
      <small>{songs.length} of {MAX_SONGS} song slots. The first two are required.</small>
    </div>
  )
}
