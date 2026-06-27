import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import SignUp from './pages/SignUp'
import './App.css'

function AppContent() {
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState('home')

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="app">
      <Navbar user={user} onPageChange={setCurrentPage} />
      <main className="main-content">
        {currentPage === 'home' && <Home user={user} onSignUpClick={() => setCurrentPage('signup')} />}
        {currentPage === 'signup' && <SignUp onSignUpComplete={() => setCurrentPage('home')} />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
