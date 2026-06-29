import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getPlatformIcon } from '../lib/socialLinkDetector'

export default function QueueDisplay() {
  const [performers, setPerformers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPerformers()

    // Poll every 10 seconds for live updates
    const interval = setInterval(fetchPerformers, 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchPerformers() {
    const { data, error } = await supabase
      .from('performers')
      .select('*')
      .order('queue_position', { ascending: true })

    if (error) {
      console.error('Error fetching performers:', error)
    } else {
      console.log('Fetched performers:', data)
      setPerformers(data || [])
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading queue...</div>

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
          <h2>🎤 Currently Performing</h2>
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
              <p><strong>1.</strong> {currentPerformer.song_1_title}</p>
              <p><strong>2.</strong> {currentPerformer.song_2_title}</p>
            </div>
            {currentPerformer.performer_notes && (
              <div className="performer-story">
                <p className="story-label">🎵 About This Artist</p>
                <p className="story-text">{currentPerformer.performer_notes}</p>
              </div>
            )}
            <div className="social-links">
              {currentPerformer.social_links && Object.entries(currentPerformer.social_links).map(([platform, url]) => (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer" title={platform}>
                  {getPlatformIcon(platform)}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {nextPerformers.length > 0 && (
        <div className="on-deck">
          <h2>⏭️ On Deck (Coming Up Next)</h2>
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
                  <span className="position-badge">#{idx + 1}</span>
                  <h4>{p.stage_name}</h4>
                </div>
                <p className="real-name">{p.real_name}</p>
                <div className="on-deck-songs">
                  <p><strong>1.</strong> {p.song_1_title}</p>
                  <p><strong>2.</strong> {p.song_2_title}</p>
                </div>
                {p.performer_notes && (
                  <div className="on-deck-story">
                    <p className="story-preview">{p.performer_notes}</p>
                  </div>
                )}
                {p.social_links && Object.keys(p.social_links).length > 0 && (
                  <div className="social-links">
                    {Object.entries(p.social_links).map(([platform, url]) => (
                      <a key={platform} href={url} target="_blank" rel="noopener noreferrer" title={platform}>
                        {getPlatformIcon(platform)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {restPerformers.length > 0 && (
        <div className="queue-list">
          <h2>📋 Queue ({restPerformers.length})</h2>
          <div className="performers-table">
            {restPerformers.map((p, idx) => (
              <div key={p.id} className="queue-row">
                <span className="position">#{nextPerformers.length + idx + 1}</span>
                <span className="name">{p.stage_name}</span>
                <div className="social-links">
                  {p.social_links && Object.entries(p.social_links).map(([platform, url]) => (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer" title={platform}>
                      {getPlatformIcon(platform)}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedPerformers.length > 0 && (
        <div className="already-performed">
          <h2>✓ Already Performed ({completedPerformers.length})</h2>
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
                <div style={{ flex: 1 }}>
                  <div className="completed-header">
                    <span className="check-mark">✓</span>
                    <span className="artist-name">{p.stage_name}</span>
                  </div>
                  {p.performer_notes && (
                    <div className="artist-story">
                      <p>{p.performer_notes}</p>
                    </div>
                  )}
                  <div className="social-links">
                    {p.social_links && Object.entries(p.social_links).map(([platform, url]) => (
                      <a key={platform} href={url} target="_blank" rel="noopener noreferrer" title={platform}>
                        {getPlatformIcon(platform)}
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
