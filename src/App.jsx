import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import EnvironmentBanner from '@environmentBanner'
import Home from './pages/Home'
import SignUp from './pages/SignUp'
import EditEntry from './pages/EditEntry'
import Admin from './pages/Admin'
import AdminLogin from './pages/AdminLogin'
import TVDisplay from './pages/TVDisplay'
import NotFound from './pages/NotFound'
import { navigate, parseLocation, pathForPage } from './lib/routes'
import './App.css'

function AppContent({ route }) {
  const { user, loading } = useAuth()
  const [editingEntryId, setEditingEntryId] = useState(null)
  const currentPage = route.page

  function changePage(page) {
    if (page !== 'edit-entry') setEditingEntryId(null)
    navigate(pathForPage(page, route.eventSlug))
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="app">
      <EnvironmentBanner />
      <Navbar user={user} currentPage={currentPage} onPageChange={changePage} eventSlug={route.eventSlug} />
      <main className="main-content">
        {currentPage === 'home' && <Home user={user} onSignUpClick={() => changePage('signup')} />}
        {currentPage === 'signup' && <SignUp onSignUpComplete={() => changePage('home')} />}
        {currentPage === 'edit-entry' && (
          <EditEntry
            entryId={editingEntryId}
            adminMode={Boolean(editingEntryId)}
            onComplete={() => changePage(editingEntryId ? 'admin' : 'home')}
          />
        )}
        {currentPage === 'admin-login' && (
          <AdminLogin
            onLoginSuccess={() => changePage('admin')}
            onCancel={() => changePage('home')}
          />
        )}
        {currentPage === 'admin' && (
          <Admin eventSlug={route.eventSlug} onEditPerformer={(id) => {
            setEditingEntryId(id)
            navigate(pathForPage('edit-entry', route.eventSlug))
          }} />
        )}
        {currentPage === 'not-found' && <NotFound eventSlug={route.eventSlug} />}
      </main>
    </div>
  )
}

export default function App() {
  const [route, setRoute] = useState(parseLocation)

  useEffect(() => {
    const syncRoute = () => setRoute(parseLocation())
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  if (route.page === 'display') return <TVDisplay eventSlug={route.eventSlug} />

  return (
    <AuthProvider>
      <AppContent route={route} />
    </AuthProvider>
  )
}
