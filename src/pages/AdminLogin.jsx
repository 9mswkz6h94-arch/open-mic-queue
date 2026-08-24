import { useState } from 'react'
import { supabase } from '@dataClient'
import { useAuth } from '../context/AuthContext'
import { isAdminEmail } from '../lib/admin'
import PageHeader from '../components/PageHeader'

export default function AdminLogin({ onLoginSuccess, onCancel }) {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If already logged in as admin, show dashboard
  if (isAdminEmail(user?.email)) {
    onLoginSuccess()
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Check if email is admin
      if (!isAdminEmail(email)) {
        throw new Error('Admin access denied. Please use the correct admin email.')
      }

      // Sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      // Wait for auth state to update
      setTimeout(() => onLoginSuccess(), 500)
    } catch (err) {
      setError(err.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <PageHeader
          eyebrow="Restricted access"
          title="Host Console"
          description="Host controls only"
          titleLevel={2}
        />

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="admin-email">Admin Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@rainbowheart.studio"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
            {loading ? 'Logging in...' : 'Access Queue Manager'}
          </button>
        </form>

        <button onClick={onCancel} className="btn btn-outline" style={{ marginTop: '16px', width: '100%' }}>
          Back to Queue
        </button>
      </div>
    </div>
  )
}
