import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const ADMIN_EMAIL = 'crystal@rainbowheart.studio'

export default function Navbar({ user, onPageChange }) {
  const isAdmin = user && user.email === ADMIN_EMAIL
  const [stageName, setStageName] = useState('')

  useEffect(() => {
    if (user) {
      fetchStageName()
    }
  }, [user])

  async function fetchStageName() {
    if (!user) return
    try {
      const { data } = await supabase
        .from('performers')
        .select('stage_name')
        .eq('auth_user_id', user.id)
        .single()

      if (data?.stage_name) {
        setStageName(data.stage_name)
      }
    } catch (err) {
      // No performer entry yet
      setStageName('')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onPageChange('home')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="navbar-title" style={{ cursor: 'pointer' }} onClick={() => onPageChange('home')}>
          🎤 Open Mic Queue
        </h1>
        <div className="navbar-actions">
          {user ? (
            <>
              <button onClick={() => onPageChange('home')} className="btn btn-nav">
                Queue
              </button>
              <button onClick={() => onPageChange('edit-entry')} className="btn btn-nav">
                ✏️ Edit My Entry
              </button>
              <button onClick={() => onPageChange('signup')} className="btn btn-nav">
                ➕ Sign Up Another
              </button>
              {isAdmin && (
                <button onClick={() => onPageChange('admin')} className="btn btn-nav">
                  🎛️ Manage
                </button>
              )}
              <span className="user-email">{stageName || user.email}</span>
              <button onClick={handleLogout} className="btn btn-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onPageChange('signup')} className="btn btn-primary">
                Sign Up to Perform
              </button>
              <button onClick={() => onPageChange('admin-login')} className="btn btn-nav">
                🎛️ Admin
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
