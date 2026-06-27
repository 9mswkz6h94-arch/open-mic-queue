import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import SignUpForm from '../components/SignUpForm'

export default function SignUp({ onSignUpComplete }) {
  const { user } = useAuth()
  const [step, setStep] = useState(user ? 'form' : 'auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError

      // Sign in immediately after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      setStep('form')
    } catch (err) {
      setError(err.message || 'Error creating account')
      setLoading(false)
    }
  }

  if (step === 'auth' && !user) {
    return (
      <div className="signup-page">
        <div className="auth-form">
          <h2>Create Your Account</h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleAuthSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="At least 6 characters"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="signup-page">
      <SignUpForm onSuccess={onSignUpComplete} />
    </div>
  )
}
