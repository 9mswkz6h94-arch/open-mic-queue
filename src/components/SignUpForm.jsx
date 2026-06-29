import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { parseSocialLinks } from '../lib/socialLinkDetector'
import { useAuth } from '../context/AuthContext'

export default function SignUpForm({ onSuccess }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    stageName: '',
    realName: '',
    song1: '',
    song2: '',
    socialLinks: '',
    original: false,
    livestream: false,
    radioFeatured: false,
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
      if (!formData.original || !formData.livestream || !formData.radioFeatured) {
        throw new Error('You must accept all terms to continue')
      }

      const parsedSocialLinks = parseSocialLinks(formData.socialLinks)

      const { error: insertError } = await supabase
        .from('performers')
        .insert({
          stage_name: formData.stageName,
          real_name: formData.realName,
          email: user.email,
          auth_user_id: user.id,
          song_1_title: formData.song1,
          song_2_title: formData.song2,
          social_links: parsedSocialLinks,
          original_confirmed: formData.original,
          livestream_confirmed: formData.livestream,
          radio_featured_confirmed: formData.radioFeatured,
          email_opt_in: formData.emailOptIn,
          queue_position: 9999,
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
        radioFeatured: false,
        emailOptIn: false,
      })

      onSuccess()
    } catch (err) {
      setError(err.message || 'Error signing up. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="signup-form">
      <h2>Sign Up to Perform</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label>Preferred Stage Name *</label>
        <input
          type="text"
          name="stageName"
          value={formData.stageName}
          onChange={handleChange}
          required
          placeholder="How should we introduce you?"
        />
      </div>

      <div className="form-group">
        <label>Real Name *</label>
        <input
          type="text"
          name="realName"
          value={formData.realName}
          onChange={handleChange}
          required
          placeholder="Your full name"
        />
      </div>

      <div className="form-group">
        <label>Song 1 Title *</label>
        <input
          type="text"
          name="song1"
          value={formData.song1}
          onChange={handleChange}
          required
          placeholder="First song you'll perform"
        />
      </div>

      <div className="form-group">
        <label>Song 2 Title *</label>
        <input
          type="text"
          name="song2"
          value={formData.song2}
          onChange={handleChange}
          required
          placeholder="Second song you'll perform"
        />
      </div>

      <div className="form-group">
        <label>Social Links (paste URLs, one per line)</label>
        <textarea
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
          ✓ I confirm this is an original song
        </label>

        <label>
          <input
            type="checkbox"
            name="livestream"
            checked={formData.livestream}
            onChange={handleChange}
            required
          />
          ✓ I consent to this being live streamed on YouTube/Facebook
        </label>

        <label>
          <input
            type="checkbox"
            name="radioFeatured"
            checked={formData.radioFeatured}
            onChange={handleChange}
            required
          />
          ✓ I consent to this potentially being featured on our radio show
        </label>

        <label>
          <input
            type="checkbox"
            name="emailOptIn"
            checked={formData.emailOptIn}
            onChange={handleChange}
          />
          ✓ I'd like to receive email reminders about upcoming open mics
        </label>
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Signing up...' : 'Sign Up to Perform'}
      </button>
    </form>
  )
}
