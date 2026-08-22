import { useEffect, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '@dataClient'
import { getSongTitles } from '../lib/songTitles'
import './TVDisplay.css'

const PHONE_QUEUE_URL = import.meta.env.VITE_PHONE_QUEUE_URL || 'https://open-mic-queue.netlify.app/'
const EVENT_NAME = import.meta.env.VITE_EVENT_NAME || 'Brother Jons Song Writer Open Mic'
const VENUE_NAME = import.meta.env.VITE_VENUE_NAME || 'Presented by Rainbow Heart Studio'
const SUPPORT_LINKS = [
  { label: 'Cash App', handle: '$rainbowheartstudio', url: 'https://cash.app/$rainbowheartstudio' },
  { label: 'Venmo', handle: '@rainbowheartstudio', url: 'https://venmo.com/rainbowheartstudio' },
]

export default function TVDisplay() {
  const [performers, setPerformers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement || document.webkitFullscreenElement))

  useEffect(() => {
    let active = true
    async function loadQueue() {
      const { data, error: queueError } = await supabase.from('performers').select('*').order('queue_position', { ascending: true })
      if (!active) return
      if (queueError) setError(queueError.message || 'Live queue unavailable')
      else { setPerformers(data || []); setError('') }
      setLoading(false)
    }
    loadQueue()
    const interval = window.setInterval(loadQueue, 5000)
    return () => { active = false; window.clearInterval(interval) }
  }, [])

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || document.webkitFullscreenElement))
    }
    document.addEventListener('fullscreenchange', syncFullscreenState)
    document.addEventListener('webkitfullscreenchange', syncFullscreenState)
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState)
      document.removeEventListener('webkitfullscreenchange', syncFullscreenState)
    }
  }, [])

  async function toggleFullscreen() {
    try {
      const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement
      if (fullscreenElement) {
        const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen
        await exitFullscreen?.call(document)
      } else {
        const root = document.documentElement
        const requestFullscreen = root.requestFullscreen || root.webkitRequestFullscreen
        await requestFullscreen?.call(root)
      }
    } catch (fullscreenError) {
      console.error('Fullscreen unavailable:', fullscreenError)
    }
  }

  const activePerformers = useMemo(() => performers.filter(performer => !performer.attended), [performers])
  const currentPerformer = activePerformers.find(performer => performer.current)
  const upcomingPerformers = activePerformers.filter(performer => !performer.current)
  const tickerItems = upcomingPerformers.length > 1 ? [...upcomingPerformers, ...upcomingPerformers] : upcomingPerformers
  const currentSongs = getSongTitles(currentPerformer)
  const visibleCurrentSongs = currentSongs.slice(0, 5)

  return (
    <div className="tv-display">
      <header className="tv-header">
        <div><p className="tv-kicker">Rainbow Heart Studio presents</p><h1>{EVENT_NAME}</h1></div>
        <div className="tv-event-meta">
          <span>Live tonight</span>
          <strong>{VENUE_NAME}</strong>
          <button type="button" className="tv-fullscreen-button" onClick={toggleFullscreen}>
            {isFullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
        </div>
      </header>

      <main className="tv-stage">
        <section className="tv-performer" aria-live="polite">
          <p className="tv-section-label">Now performing</p>
          {loading ? <div className="tv-state">Loading the live stage…</div> : error ? <div className="tv-state tv-state-error">Reconnecting to the live queue…</div> : currentPerformer ? (
            <div className="tv-performer-content">
              <div className="tv-performer-copy">
                <h2>{currentPerformer.stage_name}</h2>
                {currentPerformer.real_name && currentPerformer.real_name !== currentPerformer.stage_name && <p className="tv-real-name">{currentPerformer.real_name}</p>}
                <div className="tv-songs">
                  {visibleCurrentSongs.map((song, index) => (
                    <p key={`${currentPerformer.id}-song-${index}`}><span>{String(index + 1).padStart(2, '0')}</span>{song}</p>
                  ))}
                  {currentSongs.length > visibleCurrentSongs.length && (
                    <p className="tv-more-songs"><span>+</span>{currentSongs.length - visibleCurrentSongs.length} more in featured set</p>
                  )}
                </div>
                {currentPerformer.performer_notes && <p className="tv-artist-note">{currentPerformer.performer_notes}</p>}
              </div>
              <div className="tv-photo-frame">
                {currentPerformer.profile_picture_url ? <img src={currentPerformer.profile_picture_url} alt={currentPerformer.stage_name} /> : <div className="tv-photo-placeholder" aria-hidden="true">LIVE</div>}
              </div>
            </div>
          ) : <div className="tv-state">The stage is ready. Next performer coming up soon.</div>}
        </section>

        <aside className="tv-sidebar">
          <section className="tv-brand-card"><p className="tv-section-label">The studio</p><h2>Rainbow Heart Studio</h2><p>Music, creativity, lessons, and community built with heart.</p></section>
          <section className="tv-qr-card"><div className="tv-qr-copy"><p className="tv-section-label">Explore the full queue</p><h3>Scan with your phone</h3><p>See the running order, song titles, artist stories, music, and performer links.</p></div><QRCodeSVG value={PHONE_QUEUE_URL} size={156} bgColor="#ffffff" fgColor="#0a0a0a" level="M" /></section>
          <section className="tv-donation-card">
            <div className="tv-donation-heading"><p className="tv-section-label">Keep local music growing</p><h3>Support the studio</h3></div>
            <div className="tv-donation-options">
              {SUPPORT_LINKS.map(link => (
                <div className="tv-donation-option" key={link.label}>
                  <QRCodeSVG value={link.url} size={104} bgColor="#ffffff" fgColor="#0a0a0a" level="M" />
                  <div><strong>{link.label}</strong><span>{link.handle}</span></div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>

      <footer className="tv-ticker" aria-label="Upcoming performers">
        <div className="tv-ticker-label">Up next</div>
        <div className="tv-ticker-window">
          {tickerItems.length ? <div className={`tv-ticker-track ${upcomingPerformers.length > 1 ? 'is-scrolling' : ''}`}>{tickerItems.map((performer, index) => <span key={`${performer.id}-${index}`}>{performer.stage_name}<i aria-hidden="true">◆</i></span>)}</div> : <div className="tv-ticker-empty">Sign up from the phone queue to join tonight’s lineup.</div>}
        </div>
      </footer>
    </div>
  )
}
