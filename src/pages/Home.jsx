import { useAuth } from '../context/AuthContext'
import QueueDisplay from '../components/QueueDisplay'

export default function Home({ onSignUpClick }) {
  const { user } = useAuth()

  return (
    <div className="home-page">
      <div className="hero">
        <p className="eyebrow">Live event</p>
        <h1>Open Mic Queue</h1>
        <p>Current performer, running order, and artist information.</p>
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
