import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Mic, Mail, CheckCircle } from 'lucide-react'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [audioConsent, setAudioConsent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  const { register } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await register(email, password, audioConsent)
      setSuccessMessage(result.message || '')
      
      if (result.needsVerification) {
        setShowSuccess(true)
      } else {
        navigate('/login')
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="card text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {successMessage.toLowerCase().includes('verify your email') ? 'Check Your Email!' : 'Account Created'}
            </h2>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-gray-700 mb-2">{successMessage || "Registration successful."}</p>
              <p className="font-semibold text-gray-900">{email}</p>
            </div>
            
            <div className="text-left space-y-3 mb-6">
              <p className="text-sm text-gray-600">
                <strong>Next steps:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                {successMessage.toLowerCase().includes('verify your email') ? (
                  <>
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the verification link in the email</li>
                    <li>Return here to log in</li>
                  </>
                ) : (
                  <>
                    <li>Go to login</li>
                    <li>Use your email and password to sign in</li>
                  </>
                )}
              </ol>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full"
              >
                Go to Login
              </button>
              
              <button
                onClick={() => {
                  setShowSuccess(false)
                  setEmail('')
                  setPassword('')
                }}
                className="btn-secondary w-full"
              >
                Register Another Account
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-6">
              Didn't receive the email? Check your spam folder or try registering again.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Mic className="w-16 h-16 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">Start your interview prep journey</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
                placeholder="••••••••"
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 6 characters
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="audioConsent"
                  checked={audioConsent}
                  onChange={(e) => setAudioConsent(e.target.checked)}
                  className="mt-1 mr-3"
                />
                <label htmlFor="audioConsent" className="text-sm text-gray-700">
                  <strong>Audio Recording Consent:</strong> I consent to audio recording for interview practice. 
                  Audio will be retained for 30 days and used only for evaluation purposes.
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Login
              </Link>
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By creating an account, you agree to receive email notifications including 
              account verification and interview session updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
