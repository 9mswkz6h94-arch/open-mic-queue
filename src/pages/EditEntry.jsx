import { useEffect, useState } from 'react'
import { supabase } from '@dataClient'
import { useAuth } from '../context/AuthContext'
import { parseSocialLinks } from '../lib/socialLinkDetector'

export default function EditEntry({ onComplete, entryId = null, adminMode = false }) {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    stageName: '',
    realName: '',
    song1: '',
    song2: '',
    socialLinks: '',
    notes: '',
    profilePictureUrl: '',
  })

  useEffect(() => {
    fetchEntries()
  }, [user, entryId])

  function loadEntry(data) {
    setEntry(data)
    setFormData({
      stageName: data.stage_name || '',
      realName: data.real_name || '',
      song1: data.song_1_title || '',
      song2: data.song_2_title || '',
      socialLinks: Object.values(data.social_links || {}).join('\n'),
      notes: data.performer_notes || '',
      profilePictureUrl: data.profile_picture_url || '',
    })
  }

  async function fetchEntries() {
    if (!user) return

    try {
      let query = supabase.from('performers').select('*')
      query = entryId
        ? query.eq('id', entryId)
        : query.eq('auth_user_id', user.id).order('queue_position', { ascending: true })

      const { data, error: err } = await query

      if (err || !data?.length) {
        setError('You haven\'t signed up to perform yet. Sign up first!')
        setLoading(false)
        return
      }

      setEntries(data)
      loadEntry(data[0])
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  function handleEntrySelection(event) {
    const selected = entries.find(item => item.id === event.target.value)
    if (selected) {
      setError('')
      setSuccess('')
      loadEntry(selected)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handlePictureUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      setUploading(true)
      setError('')

      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `profile-pictures/${fileName}`

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('performers')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('performers')
        .getPublicUrl(filePath)

      if (data?.publicUrl) {
        const { error: saveError } = await supabase
          .from('performers')
          .update({ profile_picture_url: data.publicUrl })
          .eq('id', entry.id)

        if (saveError) throw saveError

        setFormData(prev => ({
          ...prev,
          profilePictureUrl: data.publicUrl,
        }))
        setEntry(prev => ({ ...prev, profile_picture_url: data.publicUrl }))
        setSuccess('Picture uploaded and saved.')
      }
    } catch (err) {
      setError(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!entry) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const parsedSocialLinks = parseSocialLinks(formData.socialLinks)

      console.log('Saving with picture URL:', formData.profilePictureUrl)

      const updateData = {
        stage_name: formData.stageName,
        real_name: formData.realName,
        song_1_title: formData.song1,
        song_2_title: formData.song2,
        social_links: parsedSocialLinks,
        performer_notes: formData.notes,
      }

      if (formData.profilePictureUrl) {
        updateData.profile_picture_url = formData.profilePictureUrl
      }

      const { error: err, data } = await supabase
        .from('performers')
        .update(updateData)
        .eq('id', entry.id)
        .select()

      console.log('Update result:', { err, data })

      if (err) throw err

      setSuccess(adminMode ? 'Performer entry updated.' : 'Entry updated.')
      setTimeout(() => {
        onComplete()
      }, 1500)
    } catch (err) {
      console.error('Save error:', err)
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
        <p className="eyebrow">Performer record / 01</p>
        <h2>{adminMode ? 'Edit Performer' : 'Edit Your Entries'}</h2>

        {!adminMode && entries.length > 1 && (
          <div className="form-group">
            <label htmlFor="edit-entry-selector">Choose an entry</label>
            <select id="edit-entry-selector" value={entry.id} onChange={handleEntrySelection}>
              {entries.map(item => (
                <option key={item.id} value={item.id}>
                  #{item.queue_position} — {item.stage_name}
                </option>
              ))}
            </select>
            <small>You can switch entries here without leaving the editor.</small>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="form-group">
          <label htmlFor="edit-stage-name">Stage Name *</label>
          <input
            id="edit-stage-name"
            type="text"
            name="stageName"
            value={formData.stageName}
            onChange={handleChange}
            placeholder="How should we introduce you?"
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-real-name">Real Name *</label>
          <input
            id="edit-real-name"
            type="text"
            name="realName"
            value={formData.realName}
            onChange={handleChange}
            placeholder="Your full name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-song-1">Song 1 Title *</label>
          <input
            id="edit-song-1"
            type="text"
            name="song1"
            value={formData.song1}
            onChange={handleChange}
            placeholder="First song you'll perform"
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-song-2">Song 2 Title *</label>
          <input
            id="edit-song-2"
            type="text"
            name="song2"
            value={formData.song2}
            onChange={handleChange}
            placeholder="Second song you'll perform"
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-social-links">Social Links (paste URLs, one per line)</label>
          <textarea
            id="edit-social-links"
            name="socialLinks"
            value={formData.socialLinks}
            onChange={handleChange}
            placeholder="https://instagram.com/yourprofile&#10;https://tiktok.com/@yourprofile"
            rows="4"
          />
          <small>Leave blank if you don't have social links</small>
        </div>

        <div className="form-group">
          <label htmlFor="edit-profile-picture">Profile Picture (optional)</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input
                id="edit-profile-picture"
                type="file"
                accept="image/*"
                onChange={handlePictureUpload}
                disabled={uploading}
              />
              <small>PNG, JPG, or GIF (max 5MB)</small>
            </div>
            {formData.profilePictureUrl && (
              <img
                src={formData.profilePictureUrl}
                alt="Profile"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="edit-performer-notes">Performer Notes (optional)</label>
          <textarea
            id="edit-performer-notes"
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
