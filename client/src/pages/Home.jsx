import { useState, useEffect } from "react";
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
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, var(--bg) 0%, var(--surface-2) 50%, var(--surface) 100%)",
        color: "var(--text-1)",
        transition: "all 0.3s ease",
      }}
    >
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center animate-fade-in">
          <div className="inline-block mb-8">
            <span
              style={{
                background:
                  "linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%)",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: "100px",
                fontSize: "14px",
                fontWeight: "700",
                boxShadow: "0 4px 16px var(--accent-glow)",
                animation: "pulse-glow 2s ease-in-out infinite",
              }}
            >
              🚀 AI-Powered Interview Practice
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              fontFamily: "'Syne', sans-serif",
              fontWeight: "800",
              marginBottom: "24px",
              lineHeight: "1.1",
              letterSpacing: "-0.02em",
            }}
          >
            Master Your Interview Skills with{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AI
            </span>
          </h1>

          <p
            style={{
              fontSize: "1.25rem",
              color: "var(--text-2)",
              marginBottom: "32px",
              maxWidth: "48rem",
              margin: "0 auto 32px",
              lineHeight: "1.6",
            }}
          >
            Practice voice-first mock interviews, get instant AI-powered
            feedback, and track your progress with adaptive difficulty.
          </p>

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background:
                  "linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%)",
                color: "#fff",
                fontSize: "1.125rem",
                padding: "16px 32px",
                borderRadius: "16px",
                fontWeight: "700",
                textDecoration: "none",
                boxShadow:
                  "0 8px 32px var(--accent-glow), 0 4px 16px rgba(0,0,0,0.3)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              className="hover:transform hover:-translate-y-2"
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 12px 48px var(--accent-glow), 0 6px 24px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 8px 32px var(--accent-glow), 0 4px 16px rgba(0,0,0,0.3)";
              }}
            >
              Go to Dashboard
              <ArrowRight size={20} />
            </Link>
          ) : (
            <div className="flex justify-center gap-6 flex-wrap">
              <Link
                to="/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background:
                    "linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%)",
                  color: "#fff",
                  fontSize: "1.125rem",
                  padding: "16px 32px",
                  borderRadius: "16px",
                  fontWeight: "700",
                  textDecoration: "none",
                  boxShadow:
                    "0 8px 32px var(--accent-glow), 0 4px 16px rgba(0,0,0,0.3)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                className="hover:transform hover:-translate-y-2"
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 12px 48px var(--accent-glow), 0 6px 24px rgba(0,0,0,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 8px 32px var(--accent-glow), 0 4px 16px rgba(0,0,0,0.3)";
                }}
              >
                Start Free Trial
                <ArrowRight size={20} />
              </Link>
              <Link
                to="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--surface)",
                  color: "var(--text-1)",
                  border: "2px solid var(--border)",
                  fontSize: "1.125rem",
                  padding: "14px 30px",
                  borderRadius: "16px",
                  fontWeight: "700",
                  textDecoration: "none",
                  boxShadow: "var(--shadow-sm)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                className="hover:transform hover:-translate-y-2"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--surface-2)";
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--surface)";
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }}
              >
                Login
              </Link>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "20px",
              padding: "32px 24px",
              border: "2px solid var(--border)",
              boxShadow: "var(--shadow-md)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              animation: "fadeIn 0.6s ease 0.1s backwards",
            }}
            className="hover:transform hover:-translate-y-2"
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "var(--shadow-lg), 0 0 30px var(--accent-glow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
            }}
          >
            <div className="flex justify-center mb-6">
              <div
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent) 20%, var(--accent-soft) 100%)",
                  padding: "16px",
                  borderRadius: "16px",
                  boxShadow: "0 4px 16px var(--accent-glow)",
                }}
              >
                <Mic
                  style={{
                    width: "40px",
                    height: "40px",
                    color: "var(--accent)",
                  }}
                />
              </div>
            </div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                marginBottom: "12px",
                color: "var(--text-1)",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              Voice-First Practice
            </h3>
            <p
              style={{
                color: "var(--text-2)",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              Practice speaking your answers naturally with real-time voice
              capture
            </p>
          </div>

          <div
            style={{
              background: "var(--surface)",
              borderRadius: "20px",
              padding: "32px 24px",
              border: "2px solid var(--border)",
              boxShadow: "var(--shadow-md)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              animation: "fadeIn 0.6s ease 0.2s backwards",
            }}
            className="hover:transform hover:-translate-y-2"
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "var(--shadow-lg), 0 0 30px var(--purple-glow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
            }}
          >
            <div className="flex justify-center mb-6">
              <div
                style={{
                  background:
                    "linear-gradient(135deg, var(--purple) 20%, rgba(168, 85, 247, 0.1) 100%)",
                  padding: "16px",
                  borderRadius: "16px",
                  boxShadow: "0 4px 16px var(--purple-glow)",
                }}
              >
                <Brain
                  style={{
                    width: "40px",
                    height: "40px",
                    color: "var(--purple)",
                  }}
                />
              </div>
            </div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                marginBottom: "12px",
                color: "var(--text-1)",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              AI Evaluation
            </h3>
            <p
              style={{
                color: "var(--text-2)",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              Get detailed rubric-based feedback on every answer you provide
            </p>
          </div>

          <div
            style={{
              background: "var(--surface)",
              borderRadius: "20px",
              padding: "32px 24px",
              border: "2px solid var(--border)",
              boxShadow: "var(--shadow-md)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              animation: "fadeIn 0.6s ease 0.3s backwards",
            }}
            className="hover:transform hover:-translate-y-2"
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "var(--shadow-lg), 0 0 30px var(--green-glow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
            }}
          >
            <div className="flex justify-center mb-6">
              <div
                style={{
                  background:
                    "linear-gradient(135deg, var(--green) 20%, rgba(16, 185, 129, 0.1) 100%)",
                  padding: "16px",
                  borderRadius: "16px",
                  boxShadow: "0 4px 16px var(--green-glow)",
                }}
              >
                <TrendingUp
                  style={{
                    width: "40px",
                    height: "40px",
                    color: "var(--green)",
                  }}
                />
              </div>
            </div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                marginBottom: "12px",
                color: "var(--text-1)",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              Adaptive Difficulty
            </h3>
            <p
              style={{
                color: "var(--text-2)",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              Questions adapt to your skill level for optimal learning
            </p>
          </div>

          <div
            style={{
              background: "var(--surface)",
              borderRadius: "20px",
              padding: "32px 24px",
              border: "2px solid var(--border)",
              boxShadow: "var(--shadow-md)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              animation: "fadeIn 0.6s ease 0.4s backwards",
            }}
            className="hover:transform hover:-translate-y-2"
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "var(--shadow-lg), 0 0 30px rgba(59, 130, 246, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
            }}
          >
            <div className="flex justify-center mb-6">
              <div
                style={{
                  background:
                    "linear-gradient(135deg, var(--blue) 20%, rgba(59, 130, 246, 0.1) 100%)",
                  padding: "16px",
                  borderRadius: "16px",
                  boxShadow: "0 4px 16px rgba(59, 130, 246, 0.3)",
                }}
              >
                <Shield
                  style={{
                    width: "40px",
                    height: "40px",
                    color: "var(--blue)",
                  }}
                />
              </div>
            </div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                marginBottom: "12px",
                color: "var(--text-1)",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              Privacy First
            </h3>
            <p
              style={{
                color: "var(--text-2)",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
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
            Join thousands of candidates practicing with Interviewbit
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
