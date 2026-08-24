import { useEffect, useState } from 'react'
import { supabase } from '@dataClient'

import { isAdminEmail } from '../lib/admin'
import { pathForPage } from '../lib/routes'

export default function Navbar({ user, currentPage, onPageChange, eventSlug }) {
  const isAdmin = isAdminEmail(user?.email)
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
        .order('queue_position', { ascending: true })
        .limit(1)

      if (data?.[0]?.stage_name) {
        setStageName(data[0].stage_name)
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
        <button type="button" className="navbar-home" onClick={() => onPageChange('home')}>
          <span className="navbar-title">Open Mic Queue</span>
          <span className="navbar-context">Live running order</span>
        </button>
        <div className="navbar-actions">
          {user ? (
            <>
              <button onClick={() => onPageChange('home')} className="btn btn-nav" aria-current={currentPage === 'home' ? 'page' : undefined}>
                Queue
              </button>
              <button onClick={() => onPageChange('edit-entry')} className="btn btn-nav" aria-current={currentPage === 'edit-entry' ? 'page' : undefined}>
                My Entries
              </button>
              <button onClick={() => onPageChange('signup')} className="btn btn-nav" aria-current={currentPage === 'signup' ? 'page' : undefined}>
                New Signup
              </button>
              {isAdmin && (
                <>
                  <button onClick={() => onPageChange('admin')} className="btn btn-nav" aria-current={currentPage === 'admin' ? 'page' : undefined}>Host Console</button>
                  <a href={pathForPage('display', eventSlug)} target="_blank" rel="noopener noreferrer" className="btn btn-nav">TV Display</a>
                </>
              )}
              <span className="user-email" title={stageName || user.email}>Signed in / {stageName || user.email}</span>
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
                Host Login
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
