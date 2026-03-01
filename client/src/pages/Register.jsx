import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { Mic, Mail, CheckCircle, AlertCircle } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [audioConsent, setAudioConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [redirectTimer, setRedirectTimer] = useState(3);

  const { register, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Auto-redirect to login after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setInterval(() => {
        setRedirectTimer((prev) => {
          if (prev <= 1) {
            navigate("/login");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showSuccess, navigate]);

  // Prevent showing this page if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await register(email, password, audioConsent);
      setSuccessMessage(result.message || "");
      setShowSuccess(true);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-blue-100 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="flex justify-center mb-6 animate-bounce">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full p-4 shadow-lg">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Account Created!
            </h2>
            <p className="text-gray-600 mb-6">Welcome to Interview.AI</p>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-6 border border-blue-200">
              <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-gray-700 mb-2 text-sm">
                {successMessage || "Registration successful."}
              </p>
              <p className="font-semibold text-gray-900 break-all">{email}</p>
            </div>

            <div className="bg-amber-50 rounded-lg p-4 mb-6 border border-amber-200">
              <p className="text-sm text-amber-900">
                <strong>Redirecting to login in {redirectTimer}s...</strong>
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/login")}
                className="btn-primary w-full"
              >
                Go to Login Now
              </button>

              <button
                onClick={() => {
                  setShowSuccess(false);
                  setEmail("");
                  setPassword("");
                  setRedirectTimer(3);
                }}
                className="btn-secondary w-full"
              >
                Register Another Account
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-6 leading-relaxed">
              Use your email and password to sign in. No email verification
              needed - you can start practicing immediately!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Mic className="w-16 h-16 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">
            Start your interview prep journey
          </p>
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
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
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
                  <strong>Audio Recording Consent:</strong> I consent to audio
                  recording for interview practice. Audio will be retained for
                  30 days and used only for evaluation purposes.
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Registration Error</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Login
              </Link>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By creating an account, you agree to receive interview session
              updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
