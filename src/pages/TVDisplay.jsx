import { useEffect, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '@dataClient'
import './TVDisplay.css'

const PHONE_QUEUE_URL = import.meta.env.VITE_PHONE_QUEUE_URL || 'https://open-mic-queue.netlify.app/'
const DONATION_URL = import.meta.env.VITE_DONATION_URL || 'https://rainbowheart.studio/'
const DONATION_LABEL = import.meta.env.VITE_DONATION_LABEL || 'Support Rainbow Heart Studio'
const EVENT_NAME = import.meta.env.VITE_EVENT_NAME || 'Open Mic Night'
const VENUE_NAME = import.meta.env.VITE_VENUE_NAME || 'Presented by Rainbow Heart Studio'

export default function TVDisplay() {
  const [performers, setPerformers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const activePerformers = useMemo(() => performers.filter(performer => !performer.attended), [performers])
  const currentPerformer = activePerformers.find(performer => performer.current)
  const upcomingPerformers = activePerformers.filter(performer => !performer.current)
  const tickerItems = upcomingPerformers.length > 1 ? [...upcomingPerformers, ...upcomingPerformers] : upcomingPerformers

  return (
    <div className="tv-display">
      <header className="tv-header">
        <div><p className="tv-kicker">Rainbow Heart Studio presents</p><h1>{EVENT_NAME}</h1></div>
        <div className="tv-event-meta"><span>Live tonight</span><strong>{VENUE_NAME}</strong></div>
      </header>

      <main className="tv-stage">
        <section className="tv-performer" aria-live="polite">
          <p className="tv-section-label">Now performing</p>
          {loading ? <div className="tv-state">Loading the live stage…</div> : error ? <div className="tv-state tv-state-error">Reconnecting to the live queue…</div> : currentPerformer ? (
            <div className="tv-performer-content">
              <div className="tv-performer-copy">
                <h2>{currentPerformer.stage_name}</h2>
                {currentPerformer.real_name && currentPerformer.real_name !== currentPerformer.stage_name && <p className="tv-real-name">{currentPerformer.real_name}</p>}
                <div className="tv-songs"><p><span>01</span>{currentPerformer.song_1_title}</p><p><span>02</span>{currentPerformer.song_2_title}</p></div>
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
          <section className="tv-donation-card"><div><p className="tv-section-label">Keep local music growing</p><h3>{DONATION_LABEL}</h3><p>Scan to support studio programs and community music events.</p></div><QRCodeSVG value={DONATION_URL} size={112} bgColor="#ffffff" fgColor="#0a0a0a" level="M" /></section>
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
