import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { parseSocialLinks } from '../lib/socialLinkDetector'

export default function EditEntry({ onComplete }) {
  const { user } = useAuth()
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    stageName: '',
    realName: '',
    song1: '',
    song2: '',
    socialLinks: '',
    notes: '',
  })

  useEffect(() => {
    fetchEntry()
  }, [user])

  async function fetchEntry() {
    if (!user) return

    try {
      const { data, error: err } = await supabase
        .from('performers')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (err) {
        setError('You haven\'t signed up to perform yet. Sign up first!')
        setLoading(false)
        return
      }

      setEntry(data)
      setFormData({
        stageName: data.stage_name || '',
        realName: data.real_name || '',
        song1: data.song_1_title || '',
        song2: data.song_2_title || '',
        socialLinks: Object.values(data.social_links || {}).join('\n'),
        notes: data.performer_notes || '',
      })
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSave() {
    if (!entry) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const parsedSocialLinks = parseSocialLinks(formData.socialLinks)

      const { error: err } = await supabase
        .from('performers')
        .update({
          stage_name: formData.stageName,
          real_name: formData.realName,
          song_1_title: formData.song1,
          song_2_title: formData.song2,
          social_links: parsedSocialLinks,
          performer_notes: formData.notes,
        })
        .eq('id', entry.id)

      if (err) throw err

      setSuccess('✓ Entry updated!')
      setTimeout(() => {
        onComplete()
      }, 1500)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">Loading your entry...</div>

  if (!entry) {
    return (
      <div className="signup-page">
        <div className="auth-form">
          <h2>No Entry Found</h2>
          <p>{error}</p>
          <button onClick={onComplete} className="btn btn-primary">
            Back to Queue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="signup-page">
      <div className="auth-form">
        <h2>Edit Your Entry</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div style={{ background: '#C3FAD6', color: '#27AE60', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>{success}</div>}

        <div className="form-group">
          <label>Stage Name *</label>
          <input
            type="text"
            name="stageName"
            value={formData.stageName}
            onChange={handleChange}
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
            placeholder="Second song you'll perform"
          />
        </div>

        <div className="form-group">
          <label>Social Links (paste URLs, one per line)</label>
          <textarea
            name="socialLinks"
            value={formData.socialLinks}
            onChange={handleChange}
            placeholder="https://instagram.com/yourprofile&#10;https://tiktok.com/@yourprofile"
            rows="4"
          />
          <small>Leave blank if you don't have social links</small>
        </div>

        <div className="form-group">
          <label>Performer Notes (optional)</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Tell us about your music, story, inspiration..."
            rows="4"
          />
          <small>Share the story behind your songs (visible when you're performing)</small>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={onComplete}
            className="btn btn-outline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
