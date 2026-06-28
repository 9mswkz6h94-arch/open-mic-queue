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

  // Filter out performers who have already performed
  const activePerformers = performers.filter(p => !p.attended)

  const currentPerformer = activePerformers.find(p => p.current)
  const nextPerformers = activePerformers.filter(p => !p.current).slice(0, 2)
  const restPerformers = activePerformers.filter(p => !p.current).slice(2)

  return (
    <div className="queue-container">
      {currentPerformer && (
        <div className="current-performer">
          <h2>🎤 Currently Performing</h2>
          <div className="performer-card current">
            <h3>{currentPerformer.stage_name}</h3>
            <p className="real-name">{currentPerformer.real_name}</p>
            <div className="songs">
              <p><strong>1.</strong> {currentPerformer.song_1_title}</p>
              <p><strong>2.</strong> {currentPerformer.song_2_title}</p>
            </div>
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
          <h2>⏭️ On Deck</h2>
          <div className="on-deck-list">
            {nextPerformers.map((p, idx) => (
              <div key={p.id} className="queue-row">
                <span className="position">#{idx + 1}</span>
                <span className="name">{p.stage_name}</span>
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
    </div>
  )
}
