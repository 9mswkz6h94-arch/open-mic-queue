import { useEffect, useState } from 'react'
import { supabase } from '@dataClient'
import { getSongTitles } from '../lib/songTitles'

export default function QueueDisplay() {
  const [performers, setPerformers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPerformers()

    // Poll every 10 seconds for live updates
    const interval = setInterval(fetchPerformers, 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchPerformers() {
    setError('')
    const { data, error } = await supabase
      .from('performers')
      .select('*')
      .order('queue_position', { ascending: true })

    if (error) {
      console.error('Error fetching performers:', error)
      setError(error.message || 'The queue could not be loaded.')
      setLoading(false)
    } else {
      console.log('Fetched performers:', data)
      setPerformers(data || [])
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading queue...</div>

  if (error) {
    return (
      <div className="queue-state error-message" role="alert">
        <h2>Queue unavailable</h2>
        <p>{error}</p>
        <button type="button" className="btn btn-primary" onClick={() => { setLoading(true); fetchPerformers() }}>
          Try again
        </button>
      </div>
    )
  }

  if (performers.length === 0) {
    return (
      <div className="queue-state" role="status">
        <h2>The queue is open</h2>
        <p>No performers have signed up yet.</p>
      </div>
    )
  }

  // Split performers into active and completed
  const activePerformers = performers.filter(p => !p.attended)
  const completedPerformers = performers.filter(p => p.attended)

  const currentPerformer = activePerformers.find(p => p.current)
  const nextPerformers = activePerformers.filter(p => !p.current).slice(0, 2)
  const restPerformers = activePerformers.filter(p => !p.current).slice(2)

  return (
    <div className="queue-container">
      {currentPerformer && (
        <div className="current-performer">
          <h2><span className="section-index">01</span> Currently performing</h2>
          <div className="performer-card current">
            {currentPerformer.profile_picture_url && (
              <img
                src={currentPerformer.profile_picture_url}
                alt={currentPerformer.stage_name}
                className="performer-avatar current-avatar"
              />
            )}
            <h3>{currentPerformer.stage_name}</h3>
            <p className="real-name">{currentPerformer.real_name}</p>
            <div className="songs">
              {getSongTitles(currentPerformer).map((song, index) => (
                <p key={`${currentPerformer.id}-song-${index}`}><strong>{index + 1}.</strong> {song}</p>
              ))}
            </div>
            {currentPerformer.performer_notes && (
              <div className="performer-story">
                <p className="story-label">Artist note</p>
                <p className="story-text">{currentPerformer.performer_notes}</p>
              </div>
            )}
            <div className="social-links">
              {currentPerformer.social_links && Object.entries(currentPerformer.social_links).map(([platform, url]) => (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${platform} profile`}>
                  Visit {platform}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {nextPerformers.length > 0 && (
        <div className="on-deck">
          <h2><span className="section-index">02</span> On deck</h2>
          <div className="on-deck-list">
            {nextPerformers.map((p, idx) => (
              <div key={p.id} className="on-deck-card">
                {p.profile_picture_url && (
                  <img
                    src={p.profile_picture_url}
                    alt={p.stage_name}
                    className="performer-avatar on-deck-avatar"
                  />
                )}
                <div className="on-deck-header">
                  <span className="position-badge" aria-label={`On deck position ${idx + 1}`}>{String(idx + 1).padStart(2, '0')}</span>
                  <h4>{p.stage_name}</h4>
                </div>
                <p className="real-name">{p.real_name}</p>
                <div className="on-deck-songs">
                  {getSongTitles(p).map((song, index) => (
                    <p key={`${p.id}-song-${index}`}><strong>{index + 1}.</strong> {song}</p>
                  ))}
                </div>
                {p.performer_notes && (
                  <div className="on-deck-story">
                    <p className="story-preview">{p.performer_notes}</p>
                  </div>
                )}
                {p.social_links && Object.keys(p.social_links).length > 0 && (
                  <div className="social-links">
                    {Object.entries(p.social_links).map(([platform, url]) => (
                      <a key={platform} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${platform} profile`}>
                        Visit {platform}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="queue-list">
        <h2><span className="section-index">03</span> Queue <span className="section-count">{String(restPerformers.length).padStart(2, '0')}</span></h2>
        {restPerformers.length > 0 ? (
          <div className="performers-table">
            {restPerformers.map((p, idx) => (
              <div key={p.id} className="queue-row">
                <span className="position" aria-label={`Queue position ${nextPerformers.length + idx + 1}`}>
                  {String(nextPerformers.length + idx + 1).padStart(2, '0')}
                </span>
                <span className="name">{p.stage_name}</span>
                <div className="social-links">
                  {p.social_links && Object.entries(p.social_links).map(([platform, url]) => (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${platform} profile`}>
                      Visit {platform}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="queue-section-empty" role="status">No additional performers are waiting beyond On Deck.</p>
        )}
      </div>

      {completedPerformers.length > 0 && (
        <div className="already-performed">
          <h2><span className="section-index">04</span> Performed <span className="section-count">{String(completedPerformers.length).padStart(2, '0')}</span></h2>
          <div className="completed-list">
            {completedPerformers.map((p) => (
              <div key={p.id} className="completed-performer">
                {p.profile_picture_url && (
                  <img
                    src={p.profile_picture_url}
                    alt={p.stage_name}
                    className="performer-avatar completed-avatar"
                  />
                )}
                <div className="completed-body">
                  <div className="completed-header">
                    <span className="check-mark">Performed</span>
                    <span className="artist-name">{p.stage_name}</span>
                  </div>
                  {p.performer_notes && (
                    <div className="artist-story">
                      <p>{p.performer_notes}</p>
                    </div>
                  )}
                  <div className="social-links">
                    {p.social_links && Object.entries(p.social_links).map(([platform, url]) => (
                      <a key={platform} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${platform} profile`}>
                        Visit {platform}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
