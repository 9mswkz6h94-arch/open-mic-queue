import { useEffect, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '@dataClient'
import { getSongTitles } from '../lib/songTitles'
import { eventPath } from '../lib/routes'
import { DISPLAY_PROMPT_EVENT, readDisplayPrompt } from '../lib/displayPromptChannel'
import './TVDisplay.css'

const PUBLIC_APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || 'https://open-mic-queue.netlify.app'
const EVENT_NAME = import.meta.env.VITE_EVENT_NAME || 'Brother Jons Song Writer Open Mic'
const VENUE_NAME = import.meta.env.VITE_VENUE_NAME || 'Presented by Rainbow Heart Studio'
const SUPPORT_LINKS = [
  { label: 'Cash App', handle: '$rainbowheartstudio', url: 'https://cash.app/$rainbowheartstudio' },
  { label: 'Venmo', handle: '@rainbowheartstudio', url: 'https://venmo.com/rainbowheartstudio' },
]
const DISPLAY_SIZES = ['standard', 'large', 'extra-large']
const DISPLAY_SIZE_LABELS = { standard: 'Standard', large: 'Large', 'extra-large': 'Extra Large' }

function getInitialDisplaySize() {
  try {
    const savedSize = window.localStorage.getItem('open-mic-tv-display-size')
    return DISPLAY_SIZES.includes(savedSize) ? savedSize : 'large'
  } catch {
    return 'large'
  }
}

function CalibrationView({ displaySize, onDisplaySizeChange, onClose, eventHomeUrl }) {
  return (
    <main className="tv-calibration">
      <div className="tv-calibration-safe-area">
        <p className="tv-section-label">TV readability check</p>
        <h2>Can you read this from the back of the room?</h2>
        <p className="tv-calibration-copy">Set browser zoom to 100%, choose the smallest comfortable display size, then enter full screen.</p>
        <div className="tv-calibration-grid">
          <div>
            <span className="tv-calibration-sample-label">Performer name</span>
            <strong>Brother Jon</strong>
            <span className="tv-calibration-song">01 &nbsp; Run Run</span>
          </div>
          <div className="tv-calibration-qr">
            <QRCodeSVG value={eventHomeUrl} size={180} bgColor="#ffffff" fgColor="#0a0a0a" level="M" />
            <span>Scan-test from the audience area</span>
          </div>
        </div>
        <div className="tv-calibration-actions">
          <div className="tv-size-control" role="group" aria-label="Display text size">
            {DISPLAY_SIZES.map(size => (
              <button key={size} type="button" className={displaySize === size ? 'is-active' : ''} aria-pressed={displaySize === size} onClick={() => onDisplaySizeChange(size)}>
                {DISPLAY_SIZE_LABELS[size]}
              </button>
            ))}
          </div>
          <button type="button" className="tv-calibration-done" onClick={onClose}>Return to display</button>
        </div>
      </div>
    </main>
  )
}

export default function TVDisplay({ eventSlug }) {
  const [performers, setPerformers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement || document.webkitFullscreenElement))
  const [displaySize, setDisplaySize] = useState(getInitialDisplaySize)
  const [isCalibrating, setIsCalibrating] = useState(() => new URLSearchParams(window.location.search).get('calibrate') === '1')
  const [publishedPrompt, setPublishedPrompt] = useState(null)
  const eventHomeUrl = import.meta.env.VITE_PHONE_QUEUE_URL || `${PUBLIC_APP_URL}${eventPath(eventSlug)}`

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

  useEffect(() => {
    let active = true
    const syncPrompt = async () => {
      try {
        const prompt = await readDisplayPrompt(eventSlug)
        if (active) setPublishedPrompt(prompt)
      } catch (promptError) {
        console.error('Display prompt unavailable:', promptError)
      }
    }
    syncPrompt()
    window.addEventListener('storage', syncPrompt)
    window.addEventListener(DISPLAY_PROMPT_EVENT, syncPrompt)
    const interval = window.setInterval(syncPrompt, 1000)
    return () => {
      active = false
      window.removeEventListener('storage', syncPrompt)
      window.removeEventListener(DISPLAY_PROMPT_EVENT, syncPrompt)
      window.clearInterval(interval)
    }
  }, [eventSlug])

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

  function changeDisplaySize(nextSize) {
    if (!DISPLAY_SIZES.includes(nextSize)) return
    setDisplaySize(nextSize)
    try {
      window.localStorage.setItem('open-mic-tv-display-size', nextSize)
    } catch {
      // The display still works when browser storage is unavailable.
    }
  }

  const activePerformers = useMemo(() => performers.filter(performer => !performer.attended), [performers])
  const currentPerformer = activePerformers.find(performer => performer.current)
  const upcomingPerformers = activePerformers.filter(performer => !performer.current)
  const tickerItems = upcomingPerformers.length > 1 ? [...upcomingPerformers, ...upcomingPerformers] : upcomingPerformers
  const currentSongs = getSongTitles(currentPerformer)
  const visibleSongLimit = displaySize === 'extra-large' ? 3 : displaySize === 'large' ? 4 : 5
  const visibleCurrentSongs = currentSongs.slice(0, visibleSongLimit)
  const hasPhoto = Boolean(currentPerformer?.profile_picture_url)
  const hasArtistNote = Boolean(currentPerformer?.performer_notes?.trim())
  const hasDistinctRealName = Boolean(currentPerformer?.real_name && currentPerformer.real_name !== currentPerformer.stage_name)
  const performerNameLength = currentPerformer?.stage_name?.length || 0
  const performerNameClass = performerNameLength > 48 ? 'tv-name-very-long' : performerNameLength > 24 ? 'tv-name-long' : ''
  const contentNameClass = performerNameLength > 48 ? ' tv-content-very-long-name' : performerNameLength > 24 ? ' tv-content-long-name' : ''
  const performerLayout = currentPerformer && !hasPhoto && !currentSongs.length && !hasArtistNote && !hasDistinctRealName
    ? 'name-only'
    : hasPhoto ? 'with-photo' : 'copy-only'

  return (
    <div className={`tv-display tv-size-${displaySize}${isCalibrating ? ' is-calibrating' : ''}`}>
      <header className="tv-header">
        <div><p className="tv-kicker">Rainbow Heart Studio presents</p><h1>{EVENT_NAME}</h1></div>
        <div className="tv-event-meta">
          <span>Live tonight</span>
          <strong>{VENUE_NAME}</strong>
          <div className="tv-size-control tv-size-control-compact" role="group" aria-label="Display text size">
            {DISPLAY_SIZES.map(size => (
              <button key={size} type="button" className={displaySize === size ? 'is-active' : ''} aria-pressed={displaySize === size} title={DISPLAY_SIZE_LABELS[size]} onClick={() => changeDisplaySize(size)}>
                {size === 'extra-large' ? 'XL' : size.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
          <button type="button" className="tv-calibrate-button" onClick={() => setIsCalibrating(value => !value)}>
            {isCalibrating ? 'Return' : 'Calibrate'}
          </button>
          <button type="button" className="tv-fullscreen-button" onClick={toggleFullscreen}>
            {isFullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
        </div>
      </header>

      {isCalibrating ? (
        <CalibrationView displaySize={displaySize} onDisplaySizeChange={changeDisplaySize} onClose={() => setIsCalibrating(false)} eventHomeUrl={eventHomeUrl} />
      ) : <><main className="tv-stage">
        <section className="tv-performer" aria-live="polite">
          <p className="tv-section-label">Now performing</p>
          {loading ? <div className="tv-state">Loading the live stage…</div> : error ? <div className="tv-state tv-state-error">Reconnecting to the live queue…</div> : currentPerformer ? (
            <div className={`tv-performer-content tv-layout-${performerLayout}${contentNameClass}`}>
              <div className="tv-performer-copy">
                <h2 className={performerNameClass}>{currentPerformer.stage_name}</h2>
                {hasDistinctRealName && <p className="tv-real-name">{currentPerformer.real_name}</p>}
                {currentSongs.length > 0 && <div className="tv-songs">
                  {visibleCurrentSongs.map((song, index) => (
                    <p key={`${currentPerformer.id}-song-${index}`}><span>{String(index + 1).padStart(2, '0')}</span>{song}</p>
                  ))}
                  {currentSongs.length > visibleCurrentSongs.length && (
                    <p className="tv-more-songs"><span>+</span>{currentSongs.length - visibleCurrentSongs.length} more in featured set</p>
                  )}
                </div>}
                {hasArtistNote && <p className="tv-artist-note">{currentPerformer.performer_notes}</p>}
              </div>
              {hasPhoto && <div className="tv-photo-frame"><img src={currentPerformer.profile_picture_url} alt={currentPerformer.stage_name} /></div>}
            </div>
          ) : <div className="tv-state">The stage is ready. Next performer coming up soon.</div>}
        </section>

        <aside className="tv-sidebar">
          <section className="tv-brand-card"><p className="tv-section-label">The studio</p><h2>Rainbow Heart Studio</h2><p>Music, creativity, lessons, and community built with heart.</p></section>
          <section className="tv-qr-card"><div className="tv-qr-copy"><p className="tv-section-label">Explore the full queue</p><h3>Scan with your phone</h3><p>See the running order, song titles, artist stories, music, and performer links.</p></div><QRCodeSVG value={eventHomeUrl} size={156} bgColor="#ffffff" fgColor="#0a0a0a" level="M" /></section>
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
          {publishedPrompt?.region === 'right_rail' && (
            <section className="tv-published-prompt tv-prompt-right-rail" aria-live="polite">
              <p className="tv-section-label">With gratitude</p>
              <h3>{publishedPrompt.content}</h3>
            </section>
          )}
        </aside>
      </main>

      <footer className={`tv-ticker${publishedPrompt?.region === 'ticker' ? ' has-published-prompt' : ''}`} aria-label={publishedPrompt?.region === 'ticker' ? 'Public announcement' : 'Upcoming performers'}>
        <div className="tv-ticker-label">{publishedPrompt?.region === 'ticker' ? 'Announcement' : 'Up next'}</div>
        <div className="tv-ticker-window">
          {publishedPrompt?.region === 'ticker'
            ? <div className="tv-prompt-ticker-copy" aria-live="polite">{publishedPrompt.content}</div>
            : tickerItems.length ? <div className={`tv-ticker-track ${upcomingPerformers.length > 1 ? 'is-scrolling' : ''}`}>{tickerItems.map((performer, index) => <span key={`${performer.id}-${index}`}>{performer.stage_name}<i aria-hidden="true">◆</i></span>)}</div> : <div className="tv-ticker-empty">Sign up from the phone queue to join tonight’s lineup.</div>}
        </div>
      </footer></>}
    </div>
  )
}
