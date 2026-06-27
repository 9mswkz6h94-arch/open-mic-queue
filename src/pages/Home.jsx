import { useAuth } from '../context/AuthContext'
import QueueDisplay from '../components/QueueDisplay'

export default function Home({ onSignUpClick }) {
  const { user } = useAuth()

  return (
    <div className="home-page">
      <div className="hero">
        <h1>🎤 Open Mic Live Queue</h1>
        <p>Check your position in real-time • Follow performers • Discover new artists</p>
        {!user && (
          <button onClick={onSignUpClick} className="btn btn-primary btn-large">
            Sign Up to Perform
          </button>
        )}
      </div>

      <QueueDisplay />
    </div>
  )
}
