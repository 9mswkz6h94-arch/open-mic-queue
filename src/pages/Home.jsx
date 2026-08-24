import { useAuth } from '../context/AuthContext'
import QueueDisplay from '../components/QueueDisplay'
import PageHeader from '../components/PageHeader'

export default function Home({ onSignUpClick }) {
  const { user } = useAuth()

  return (
    <div className="home-page">
      <PageHeader
        className="hero"
        eyebrow="Live event"
        title="Open Mic Queue"
        description="Current performer, running order, and artist information."
        actions={!user ? (
          <button onClick={onSignUpClick} className="btn btn-primary btn-large">
            Sign Up to Perform
          </button>
        ) : null}
      />

      <QueueDisplay />
    </div>
  )
}
