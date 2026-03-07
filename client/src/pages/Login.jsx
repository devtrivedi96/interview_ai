import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { Mic, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if already authenticated
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
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      const errorMessage = err.message || "Login failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-8 sm:py-12 px-3 sm:px-4"
      style={{
        background:
          "linear-gradient(135deg, #0a0a0f 0%, #1e1e2b 50%, #16161f 100%)",
      }}
    >
      <div className="max-w-md w-full animate-scale-in">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-5 sm:mb-6">
            <div
              style={{
                background: "linear-gradient(135deg, #ff6b35 0%, #a855f7 100%)",
                boxShadow:
                  "0 8px 32px rgba(255, 107, 53, 0.3), 0 4px 16px rgba(0,0,0,0.3)",
              }}
              className="rounded-full p-4 sm:p-5 shadow-lg transition-transform hover:scale-110 hover:rotate-6"
            >
              <Mic className="w-10 h-10 sm:w-14 sm:h-14 text-white" />
            </div>
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-3"
            style={{
              fontFamily: "'Syne', sans-serif",
              background: "linear-gradient(135deg, #f0f0f5 0%, #ff6b35 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Welcome Back
          </h2>
          <p style={{ color: "#b0b0c0" }} className="text-base sm:text-lg px-2">
            Login to continue your interview prep
          </p>
        </div>

        <div
          style={{
            background: "#16161f",
            border: "2px solid #2a2a3d",
            boxShadow:
              "0 16px 48px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.4)",
          }}
          className="rounded-2xl p-5 sm:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label
                className="block text-[13px] sm:text-sm font-semibold mb-2"
                style={{ color: "#b0b0c0" }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  background: "#1e1e2b",
                  border: "2px solid #2a2a3d",
                  color: "#f0f0f5",
                }}
                className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl outline-none transition-all focus:border-[#ff6b35] focus:shadow-[0_0_0_3px_rgba(255,107,53,0.25)]"
                required
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label
                className="block text-[13px] sm:text-sm font-semibold mb-2"
                style={{ color: "#b0b0c0" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    background: "#1e1e2b",
                    border: "2px solid #2a2a3d",
                    color: "#f0f0f5",
                  }}
                  className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl outline-none transition-all focus:border-[#ff6b35] focus:shadow-[0_0_0_3px_rgba(255,107,53,0.25)]"
                  required
                  placeholder="••••••••"
                  minLength={6}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#70707e" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#ff6b35")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#70707e")
                  }
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)",
                  border: "2px solid rgba(239, 68, 68, 0.3)",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
                }}
                className="p-3 sm:p-4 rounded-xl animate-shake"
              >
                <div className="flex items-start">
                  <AlertCircle
                    className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"
                    style={{ color: "#ef4444" }}
                  />
                  <div className="flex-1">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#ef4444" }}
                    >
                      Login Failed
                    </p>
                    <p className="text-sm mt-1" style={{ color: "#ef4444" }}>
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading
                  ? "#6b7280"
                  : "linear-gradient(135deg, #ff6b35 0%, #a855f7 100%)",
                boxShadow: loading
                  ? "none"
                  : "0 8px 32px rgba(255, 107, 53, 0.3), 0 4px 16px rgba(0,0,0,0.3)",
              }}
              className="w-full text-white text-sm sm:text-base font-bold py-3 sm:py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:transform hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(255,107,53,0.4),0_6px_24px_rgba(0,0,0,0.4)]"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-5 sm:mt-6 text-center">
            <p className="text-sm" style={{ color: "#b0b0c0" }}>
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-bold transition-colors"
                style={{ color: "#ff6b35" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#a855f7")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#ff6b35")}
              >
                Create one
              </Link>
            </p>
          </div>

          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6" style={{ borderTop: "1px solid #2a2a3d" }}>
            <p className="text-xs text-center" style={{ color: "#70707e" }}>
              Use your registered email and password to log in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
