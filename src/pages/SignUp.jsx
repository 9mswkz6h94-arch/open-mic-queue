import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import SignUpForm from '../components/SignUpForm'

export default function SignUp({ onSignUpComplete }) {
  const { user } = useAuth()
  const [step, setStep] = useState(user ? 'form' : 'auth')
  const [isLogin, setIsLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // Login existing account
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw new Error('Email or password incorrect')
        setStep('form')
        return
      }

      // Sign up new account
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      // If user already registered, try to sign in instead
      if (signUpError && signUpError.message.includes('already registered')) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw new Error('Account exists. Wrong password?')
        setStep('form')
        return
      }

      if (signUpError) throw signUpError

      // Sign in immediately after new signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      setStep('form')
    } catch (err) {
      setError(err.message || 'Error with account')
      setLoading(false)
    }
  }

  if (step === 'auth' && !user) {
    return (
      <div className="signup-page">
        <div className="auth-form">
          <h2>{isLogin ? 'Log In' : 'Create Your Account'}</h2>

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
              {loading ? (isLogin ? 'Logging in...' : 'Creating account...') : (isLogin ? 'Log In' : 'Create Account')}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setEmail('')
                setPassword('')
              }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
            >
              {isLogin ? 'Create one' : 'Log in'}
            </button>
          </p>
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
