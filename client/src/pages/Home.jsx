import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import {
  Mic,
  Brain,
  TrendingUp,
  Shield,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="bg-gradient-to-b from-slate-50 via-blue-50 to-cyan-50 min-h-screen">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="inline-block mb-6">
            <span className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-full text-sm font-semibold">
              🚀 AI-Powered Interview Practice
            </span>
          </div>

          <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Master Your Interview Skills with{" "}
            <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
              AI
            </span>
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Practice voice-first mock interviews, get instant AI-powered
            feedback, and track your progress with adaptive difficulty.
          </p>

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-lg px-8 py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition duration-300"
            >
              Go to Dashboard
              <ArrowRight size={20} />
            </Link>
          ) : (
            <div className="flex justify-center gap-4 flex-wrap">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-lg px-8 py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition duration-300"
              >
                Start Free Trial
                <ArrowRight size={20} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-white text-primary-600 border-2 border-primary-600 text-lg px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition duration-300"
              >
                Login
              </Link>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition duration-300 border border-gray-100">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-primary-100 to-primary-50 p-4 rounded-lg">
                <Mic className="w-10 h-10 text-primary-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              Voice-First Practice
            </h3>
            <p className="text-gray-600 text-sm">
              Practice speaking your answers naturally with real-time voice
              capture
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition duration-300 border border-gray-100">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-4 rounded-lg">
                <Brain className="w-10 h-10 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              AI Evaluation
            </h3>
            <p className="text-gray-600 text-sm">
              Get detailed rubric-based feedback on every answer you provide
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition duration-300 border border-gray-100">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-green-100 to-green-50 p-4 rounded-lg">
                <TrendingUp className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              Adaptive Difficulty
            </h3>
            <p className="text-gray-600 text-sm">
              Questions adapt to your skill level for optimal learning
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition duration-300 border border-gray-100">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-4 rounded-lg">
                <Shield className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              Privacy First
            </h3>
            <p className="text-gray-600 text-sm">
              Your data is secure with explicit consent management
            </p>
          </div>
        </div>

        {/* Interview Types */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Interview Types
            </h2>
            <p className="text-lg text-gray-600">
              Choose your interview type and start practicing today
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                DSA Interviews
              </h3>
              <p className="text-gray-600 mb-6">
                Practice data structures and algorithms with focus on
                problem-solving, complexity analysis, and clear communication.
              </p>
              <ul className="text-sm text-gray-600 space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="text-green-600 flex-shrink-0 mt-0.5"
                  />{" "}
                  Problem understanding
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="text-green-600 flex-shrink-0 mt-0.5"
                  />{" "}
                  Approach quality
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="text-green-600 flex-shrink-0 mt-0.5"
                  />{" "}
                  Complexity analysis
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Mic className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                HR/Behavioral
              </h3>
              <p className="text-gray-600 mb-6">
                Master behavioral questions with STAR format, specific examples,
                and professional communication.
              </p>
              <ul className="text-sm text-gray-600 space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="text-green-600 flex-shrink-0 mt-0.5"
                  />{" "}
                  STAR format structure
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="text-green-600 flex-shrink-0 mt-0.5"
                  />{" "}
                  Specific evidence
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="text-green-600 flex-shrink-0 mt-0.5"
                  />{" "}
                  Self-awareness
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                System Design
              </h3>
              <p className="text-gray-600 mb-6">
                Practice system architecture discussions with focus on
                scalability, trade-offs, and component design.
              </p>
              <ul className="text-sm text-gray-600 space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="text-green-600 flex-shrink-0 mt-0.5"
                  />{" "}
                  Requirements gathering
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="text-green-600 flex-shrink-0 mt-0.5"
                  />{" "}
                  Architecture design
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="text-green-600 flex-shrink-0 mt-0.5"
                  />{" "}
                  Trade-offs discussion
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to ace your interviews?
          </h2>
          <p className="text-primary-100 mb-8 text-lg">
            Join thousands of candidates practicing with Interview.AI
          </p>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition duration-300"
            >
              Get Started Free
              <ArrowRight size={20} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
