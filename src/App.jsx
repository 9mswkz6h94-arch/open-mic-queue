import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import EnvironmentBanner from '@environmentBanner'
import Home from './pages/Home'
import SignUp from './pages/SignUp'
import EditEntry from './pages/EditEntry'
import Admin from './pages/Admin'
import AdminLogin from './pages/AdminLogin'
import TVDisplay from './pages/TVDisplay'
import './App.css'

const isTVDisplay = new URLSearchParams(window.location.search).get('display') === 'tv'

function AppContent() {
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState('home')
  const [editingEntryId, setEditingEntryId] = useState(null)

  function changePage(page) {
    if (page !== 'edit-entry') setEditingEntryId(null)
    setCurrentPage(page)
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="app">
      <EnvironmentBanner />
      <Navbar user={user} currentPage={currentPage} onPageChange={changePage} />
      <main className="main-content">
        {currentPage === 'home' && <Home user={user} onSignUpClick={() => setCurrentPage('signup')} />}
        {currentPage === 'signup' && <SignUp onSignUpComplete={() => setCurrentPage('home')} />}
        {currentPage === 'edit-entry' && (
          <EditEntry
            entryId={editingEntryId}
            adminMode={Boolean(editingEntryId)}
            onComplete={() => changePage(editingEntryId ? 'admin' : 'home')}
          />
        )}
        {currentPage === 'admin-login' && (
          <AdminLogin
            onLoginSuccess={() => setCurrentPage('admin')}
            onCancel={() => setCurrentPage('home')}
          />
        )}
        {currentPage === 'admin' && (
          <Admin onEditPerformer={(id) => {
            setEditingEntryId(id)
            setCurrentPage('edit-entry')
          }} />
        )}
      </main>
    </div>
  )
}

export default function App() {
  if (isTVDisplay) return <TVDisplay />

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
