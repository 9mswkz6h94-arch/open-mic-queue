import { useState } from 'react'
import { supabase } from '@dataClient'
import { parseSocialLinks } from '../lib/socialLinkDetector'
import { useAuth } from '../context/AuthContext'
import { isAdminEmail } from '../lib/admin'

export default function SignUpForm({ onSuccess }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [entryOwner, setEntryOwner] = useState('self')
  const [guestEmail, setGuestEmail] = useState('')
  const [formData, setFormData] = useState({
    stageName: '',
    realName: '',
    song1: '',
    song2: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.original || !formData.livestream || !formData.promotionalUse) {
        throw new Error('You must accept all terms to continue')
      }

      const parsedSocialLinks = parseSocialLinks(formData.socialLinks)

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
          email: entryOwner === 'guest' ? guestEmail : user.email,
          auth_user_id: entryOwner === 'guest' ? null : user.id,
          created_by: user.id,
          song_1_title: formData.song1,
          song_2_title: formData.song2,
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
        song1: '',
        song2: '',
        socialLinks: '',
        original: false,
        livestream: false,
        promotionalUse: false,
        emailOptIn: false,
      })
      setGuestEmail('')

      onSuccess()
    } catch (err) {
      setError(err.message || 'Error signing up. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="signup-form">
      <p className="eyebrow">Performer registration / 01</p>
      <h2>Sign Up to Perform</h2>

      {error && <div className="error-message">{error}</div>}

      {isAdminEmail(user?.email) && (
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
            value={guestEmail}
            onChange={(event) => setGuestEmail(event.target.value)}
            required
            placeholder="performer@example.com"
          />
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

      <div className="form-group">
        <label htmlFor="signup-song-1">Song 1 Title *</label>
        <input
          id="signup-song-1"
          type="text"
          name="song1"
          value={formData.song1}
          onChange={handleChange}
          required
          placeholder="First song you'll perform"
        />
      </div>

      <div className="form-group">
        <label htmlFor="signup-song-2">Song 2 Title *</label>
        <input
          id="signup-song-2"
          type="text"
          name="song2"
          value={formData.song2}
          onChange={handleChange}
          required
          placeholder="Second song you'll perform"
        />
      </div>

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

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Signing up...' : 'Sign Up to Perform'}
      </button>
    </form>
  )
}
