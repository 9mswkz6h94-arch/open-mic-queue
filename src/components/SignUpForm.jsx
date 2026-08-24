import { useMemo, useState } from 'react'
import { supabase } from '@dataClient'
import { parseSocialLinks } from '../lib/socialLinkDetector'
import { useAuth } from '../context/AuthContext'
import { isAdminEmail } from '../lib/admin'
import SongFields from './SongFields'
import PageHeader from './PageHeader'
import { normalizeSongTitles } from '../lib/songTitles'

export default function SignUpForm({ onSuccess, hostMode = false, existingPerformers = [] }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [entryOwner, setEntryOwner] = useState(hostMode ? 'guest' : 'self')
  const [guestEmail, setGuestEmail] = useState('')
  const [selectedPerformerEmail, setSelectedPerformerEmail] = useState('')
  const [performerSearch, setPerformerSearch] = useState('')
  const [formData, setFormData] = useState({
    stageName: '',
    realName: '',
    songs: ['', ''],
    socialLinks: '',
    original: false,
    livestream: false,
    promotionalUse: false,
    emailOptIn: false,
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const normalizedSearch = performerSearch.trim().toLowerCase()
  const performerMatches = useMemo(() => {
    if (!hostMode || normalizedSearch.length < 2) return []

    const seen = new Set()
    return existingPerformers.filter((performer) => {
      const searchable = [performer.stage_name, performer.real_name, performer.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      const identity = `${performer.stage_name || ''}|${performer.email || ''}`.toLowerCase()
      if (!searchable.includes(normalizedSearch) || seen.has(identity)) return false
      seen.add(identity)
      return true
    }).slice(0, 5)
  }, [existingPerformers, hostMode, normalizedSearch])

  const activeDuplicate = useMemo(() => {
    if (!hostMode) return null
    const email = (guestEmail || selectedPerformerEmail).trim().toLowerCase()
    const stageName = formData.stageName.trim().toLowerCase()
    if (!email && !stageName) return null

    return existingPerformers.find((performer) => {
      if (performer.attended) return false
      const sameEmail = email && performer.email?.trim().toLowerCase() === email
      const sameStageName = stageName && performer.stage_name?.trim().toLowerCase() === stageName
      return sameEmail || sameStageName
    }) || null
  }, [existingPerformers, formData.stageName, guestEmail, hostMode, selectedPerformerEmail])

  const selectPerformer = (performer) => {
    const priorSongs = Array.isArray(performer.song_titles) && performer.song_titles.length
      ? performer.song_titles
      : [performer.song_1_title || '', performer.song_2_title || '']
    const paddedSongs = priorSongs.map(song => typeof song === 'string' ? song : '')
    while (paddedSongs.length < 2) paddedSongs.push('')
    const priorSocialLinks = performer.social_links && typeof performer.social_links === 'object'
      ? Object.values(performer.social_links).filter(link => typeof link === 'string').join('\n')
      : ''

    setFormData(prev => ({
      ...prev,
      stageName: performer.stage_name || '',
      realName: performer.real_name || '',
      songs: paddedSongs,
      socialLinks: priorSocialLinks,
    }))
    setGuestEmail(performer.email || '')
    setSelectedPerformerEmail(performer.email || '')
    setPerformerSearch(performer.stage_name || performer.real_name || '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (activeDuplicate) {
        throw new Error(`${activeDuplicate.stage_name} is already active in tonight's queue. Edit or requeue that entry instead.`)
      }

      if (!formData.original || !formData.livestream || !formData.promotionalUse) {
        throw new Error('You must accept all terms to continue')
      }

      const parsedSocialLinks = parseSocialLinks(formData.socialLinks)
      const songTitles = normalizeSongTitles(formData.songs)
      if (songTitles.length < 2) throw new Error('Please enter at least two songs')

      const { data: maxData } = await supabase
        .from('performers')
        .select('queue_position')
        .order('queue_position', { ascending: false })
        .limit(1)
      const nextPosition = (maxData?.[0]?.queue_position ?? 0) + 1

      const { error: insertError } = await supabase
        .from('performers')
        .insert({
          stage_name: formData.stageName,
          real_name: formData.realName,
          email: entryOwner === 'guest' ? (guestEmail || selectedPerformerEmail) : user.email,
          auth_user_id: entryOwner === 'guest' ? null : user.id,
          created_by: user.id,
          song_1_title: songTitles[0],
          song_2_title: songTitles[1],
          song_titles: songTitles,
          social_links: parsedSocialLinks,
          original_confirmed: formData.original,
          livestream_confirmed: formData.livestream,
          // Legacy database column retained until a safe schema migration renames it.
          radio_featured_confirmed: formData.promotionalUse,
          email_opt_in: formData.emailOptIn,
          queue_position: nextPosition,
        })

      if (insertError) throw insertError

      setFormData({
        stageName: '',
        realName: '',
        songs: ['', ''],
        socialLinks: '',
        original: false,
        livestream: false,
        promotionalUse: false,
        emailOptIn: false,
      })
      setGuestEmail('')
      setSelectedPerformerEmail('')

      await onSuccess?.()
    } catch (err) {
      setError(err.message || 'Error signing up. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`signup-form${hostMode ? ' host-quick-signup' : ''}`}>
      <PageHeader
        eyebrow={hostMode ? 'Host workspace / Quick entry' : 'Performer registration / 01'}
        title={hostMode ? 'Quick Signup' : 'Sign Up to Perform'}
        titleLevel={2}
        description={hostMode ? 'Find a returning performer or add a new guest without leaving the console.' : undefined}
      />

      {error && <div className="error-message">{error}</div>}

      {hostMode && (
        <div className="form-group performer-lookup">
          <label htmlFor="host-performer-search">Find returning performer</label>
          <input
            id="host-performer-search"
            type="search"
            value={performerSearch}
            onChange={(event) => setPerformerSearch(event.target.value)}
            placeholder="Search name or email"
            autoComplete="off"
          />
          {performerMatches.length > 0 && (
            <div className="performer-lookup-results" aria-label="Matching performers">
              {performerMatches.map(performer => (
                <button
                  key={performer.id}
                  type="button"
                  className="performer-lookup-result"
                  onClick={() => selectPerformer(performer)}
                >
                  <strong>{performer.stage_name}</strong>
                  <span>{performer.real_name}{performer.email ? ` · ${performer.email}` : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isAdminEmail(user?.email) && !hostMode && (
        <div className="form-group">
          <label htmlFor="signup-entry-owner">Who is this signup for?</label>
          <select
            id="signup-entry-owner"
            value={entryOwner}
            onChange={(event) => setEntryOwner(event.target.value)}
          >
            <option value="self">My own performer entry</option>
            <option value="guest">A guest I am adding as host</option>
          </select>
          <small>Guest entries stay separate from your personal entries and remain editable in the Host Console.</small>
        </div>
      )}

      {entryOwner === 'guest' && (
        <div className="form-group">
          <label htmlFor="signup-guest-email">Guest Email *</label>
          <input
            id="signup-guest-email"
            type="email"
            value={guestEmail || selectedPerformerEmail}
            onChange={(event) => {
              setGuestEmail(event.target.value)
              setSelectedPerformerEmail('')
            }}
            required
            placeholder="performer@example.com"
          />
        </div>
      )}

      {activeDuplicate && (
        <div className="duplicate-warning" role="alert">
          <strong>Already in tonight's queue:</strong> {activeDuplicate.stage_name}. Edit or requeue the existing entry instead of creating a duplicate.
        </div>
      )}

      <div className="form-group">
        <label htmlFor="signup-stage-name">Preferred Stage Name *</label>
        <input
          id="signup-stage-name"
          type="text"
          name="stageName"
          value={formData.stageName}
          onChange={handleChange}
          required
          placeholder="How should we introduce you?"
        />
      </div>

      <div className="form-group">
        <label htmlFor="signup-real-name">Real Name *</label>
        <input
          id="signup-real-name"
          type="text"
          name="realName"
          value={formData.realName}
          onChange={handleChange}
          required
          placeholder="Your full name"
        />
      </div>

      <SongFields
        idPrefix="signup-song"
        songs={formData.songs}
        onChange={(songs) => setFormData(prev => ({ ...prev, songs }))}
      />

      <div className="form-group">
        <label htmlFor="signup-social-links">Social Links (paste URLs, one per line)</label>
        <textarea
          id="signup-social-links"
          name="socialLinks"
          value={formData.socialLinks}
          onChange={handleChange}
          placeholder="https://instagram.com/yourprofile&#10;https://tiktok.com/@yourprofile&#10;https://youtube.com/@yourchannel"
          rows="4"
        />
        <small>Leave blank if you don't have social links</small>
      </div>

      <div className="checkboxes">
        <label>
          <input
            type="checkbox"
            name="original"
            checked={formData.original}
            onChange={handleChange}
            required
          />
          I confirm this is an original song
        </label>

        <label>
          <input
            type="checkbox"
            name="livestream"
            checked={formData.livestream}
            onChange={handleChange}
            required
          />
          I consent to this being live streamed on YouTube/Facebook
        </label>

        <label>
          <input
            type="checkbox"
            name="promotionalUse"
            checked={formData.promotionalUse}
            onChange={handleChange}
            required
          />
          I consent to clips or recordings being used in Open Mic social media, event promotion, or promotional material for future shows
        </label>

        <label>
          <input
            type="checkbox"
            name="emailOptIn"
            checked={formData.emailOptIn}
            onChange={handleChange}
          />
          I'd like to receive email reminders about upcoming open mics
        </label>
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading || Boolean(activeDuplicate)}>
        {loading ? 'Signing up...' : (hostMode ? 'Add to Queue' : 'Sign Up to Perform')}
      </button>
    </form>
  )
}
