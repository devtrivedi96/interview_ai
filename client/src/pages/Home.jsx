import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Mic, Brain, TrendingUp, Shield } from 'lucide-react'

export default function Home() {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="bg-gradient-to-br from-primary-50 to-blue-100 min-h-screen">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Master Your Interview Skills with AI
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Practice voice-first mock interviews, get instant AI-powered feedback,
            and track your progress with adaptive difficulty.
          </p>
          
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary text-lg px-8 py-4 inline-block">
              Go to Dashboard
            </Link>
          ) : (
            <div className="flex justify-center space-x-4">
              <Link to="/register" className="btn-primary text-lg px-8 py-4">
                Start Free Trial
              </Link>
              <Link to="/login" className="btn-secondary text-lg px-8 py-4">
                Login
              </Link>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Mic className="w-12 h-12 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Voice-First Practice</h3>
            <p className="text-gray-600">
              Practice speaking your answers naturally with real-time voice capture
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Brain className="w-12 h-12 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Evaluation</h3>
            <p className="text-gray-600">
              Get detailed rubric-based feedback on every answer you provide
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <TrendingUp className="w-12 h-12 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Adaptive Difficulty</h3>
            <p className="text-gray-600">
              Questions adapt to your skill level for optimal learning
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Shield className="w-12 h-12 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
            <p className="text-gray-600">
              Your data is secure with explicit consent management
            </p>
          </div>
        </div>

        {/* Interview Types */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">Interview Types</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card">
              <h3 className="text-xl font-semibold mb-3">DSA Interviews</h3>
              <p className="text-gray-600 mb-4">
                Practice data structures and algorithms with focus on problem-solving,
                complexity analysis, and clear communication.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Problem understanding</li>
                <li>• Approach quality</li>
                <li>• Complexity analysis</li>
              </ul>
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold mb-3">HR/Behavioral</h3>
              <p className="text-gray-600 mb-4">
                Master behavioral questions with STAR format, specific examples,
                and professional communication.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• STAR format structure</li>
                <li>• Specific evidence</li>
                <li>• Self-awareness</li>
              </ul>
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold mb-3">System Design</h3>
              <p className="text-gray-600 mb-4">
                Practice system architecture discussions with focus on scalability,
                trade-offs, and component design.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Requirements gathering</li>
                <li>• Architecture design</li>
                <li>• Trade-offs discussion</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
