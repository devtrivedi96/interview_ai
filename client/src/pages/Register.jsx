import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { Mic, Mail, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  .register-root {
    min-height: 100vh;
    background: linear-gradient(135deg, var(--bg), var(--surface));
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    font-family: var(--font-body);
    color: var(--text-1);
    position: relative;
    overflow: hidden;
  }

  .register-root::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 20%, rgba(255, 107, 53, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 70% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }

  .register-container {
    max-width: 480px;
    width: 100%;
    position: relative;
    z-index: 1;
  }

  .register-header {
    text-align: center;
    margin-bottom: 40px;
    animation: fadeUp 0.8s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .register-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    background: linear-gradient(135deg, var(--accent), var(--purple));
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 8px 32px rgba(255, 107, 53, 0.3);
    animation: float 3s ease-in-out infinite;
  }

  .register-title {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 700;
    background: linear-gradient(135deg, var(--text-1), var(--accent));
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 8px;
  }

  .register-subtitle {
    font-size: 1rem;
    color: var(--text-2);
    font-weight: 500;
  }

  .register-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 40px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(20px);
    position: relative;
    animation: fadeUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) 0.2s both;
  }

  .register-card::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    background: linear-gradient(135deg, var(--accent), var(--purple), var(--green));
    border-radius: 24px;
    z-index: -1;
    opacity: 0.3;
  }

  .register-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .input-label {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 600;
    color: var(--text-1);
  }

  .input-field {
    background: var(--surface-2);
    border: 2px solid var(--border);
    border-radius: 12px;
    padding: 16px 20px;
    font-size: 16px;
    color: var(--text-1);
    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    font-family: var(--font-body);
  }

  .input-field:focus {
    outline: none;
    border-color: var(--accent);
    background: var(--bg);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
    transform: translateY(-2px);
  }

  .input-field::placeholder {
    color: var(--text-3);
  }

  .input-hint {
    font-size: 12px;
    color: var(--text-3);
  }

  .consent-panel {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px;
    position: relative;
  }

  .consent-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--blue), var(--purple));
    border-radius: 16px 16px 0 0;
  }

  .consent-checkbox {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .consent-checkbox input {
    margin-top: 4px;
    accent-color: var(--accent);
    transform: scale(1.2);
  }

  .consent-label {
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-2);
  }

  .consent-label strong {
    color: var(--text-1);
  }

  .error-panel {
    background: rgba(220, 38, 38, 0.1);
    border: 1px solid rgba(220, 38, 38, 0.3);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .error-icon {
    color: #dc2626;
    margin-top: 2px;
    flex-shrink: 0;
  }

  .error-content h4 {
    font-size: 14px;
    font-weight: 600;
    color: #dc2626;
    margin-bottom: 4px;
  }

  .error-content p {
    font-size: 13px;
    color: #dc2626;
    opacity: 0.9;
  }

  .register-button {
    background: linear-gradient(135deg, var(--accent), #e55a2b);
    border: none;
    border-radius: 12px;
    padding: 16px 24px;
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    position: relative;
    overflow: hidden;
  }

  .register-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  .register-button:hover::before {
    left: 100%;
  }

  .register-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(255, 107, 53, 0.4);
  }

  .register-button:active {
    transform: translateY(0);
  }

  .register-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .register-footer {
    text-align: center;
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid var(--border);
  }

  .login-link {
    color: var(--text-2);
    font-size: 14px;
  }

  .login-link a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.3s ease;
  }

  .login-link a:hover {
    color: var(--purple);
  }

  .register-disclaimer {
    font-size: 12px;
    color: var(--text-3);
    line-height: 1.4;
    margin-top: 16px;
  }

  .success-container {
    text-align: center;
    animation: fadeUp 0.8s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .success-icon {
    width: 100px;
    height: 100px;
    margin: 0 auto 32px;
    background: linear-gradient(135deg, var(--green), var(--blue));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    animation: scaleIn 0.8s cubic-bezier(0.23, 1, 0.32, 1) 0.3s both;
    position: relative;
  }

  .success-icon::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--green), var(--blue));
    z-index: -1;
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .success-title {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-1);
    margin-bottom: 12px;
  }

  .success-subtitle {
    color: var(--text-2);
    margin-bottom: 32px;
  }

  .success-email {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
    position: relative;
  }

  .success-email::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--blue), var(--green));
    border-radius: 16px 16px 0 0;
  }

  .success-email-icon {
    color: var(--blue);
    margin: 0 auto 12px;
    display: block;
  }

  .success-email p {
    font-size: 14px;
    color: var(--text-2);
    margin-bottom: 8px;
  }

  .success-email .email {
    font-weight: 600;
    color: var(--text-1);
    word-break: break-all;
  }

  .success-timer {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 32px;
    color: #f59e0b;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .button-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .btn-secondary {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 24px;
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 600;
    color: var(--text-2);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-secondary:hover {
    background: var(--surface);
    color: var(--text-1);
    transform: translateY(-1px);
  }

  .theme-toggle-container {
    position: absolute;
    top: 24px;
    right: 24px;
    z-index: 10;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes pulse-glow {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }

  @media (max-width: 640px) {
    .register-root {
      padding: 16px 12px;
    }
    
    .register-card {
      padding: 24px;
    }
    
    .register-title {
      font-size: 1.75rem;
    }
    
    .theme-toggle-container {
      top: 16px;
      right: 16px;
    }
  }
`;

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [audioConsent, setAudioConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(email, password, audioConsent);
      setSuccessMessage(
        "Account created successfully! You can now log in with your credentials.",
      );
      setShowSuccess(true);

      // Auto redirect after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="register-root">
          <div className="theme-toggle-container">
            <ThemeToggle />
          </div>
          <div className="register-container">
            <div className="success-container">
              <div className="success-icon">
                <CheckCircle size={48} />
              </div>

              <h2 className="success-title">Account Created!</h2>
              <p className="success-subtitle">Welcome to Interviewbit</p>

              <div className="success-email">
                <Mail size={32} className="success-email-icon" />
                <p>{successMessage || "Registration successful."}</p>
                <p className="email">{email}</p>
              </div>

              <div className="success-timer">
                <Sparkles size={16} />
                Redirecting to login automatically...
              </div>

              <div className="button-group">
                <button
                  onClick={() => navigate("/login")}
                  className="register-button"
                >
                  Go to Login Now
                </button>

                <button
                  onClick={() => {
                    setShowSuccess(false);
                    setEmail("");
                    setPassword("");
                  }}
                  className="btn-secondary"
                >
                  Register Another Account
                </button>
              </div>

              <p className="register-disclaimer">
                Use your email and password to sign in. No email verification
                needed - you can start practicing immediately!
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="register-root">
        <div className="theme-toggle-container">
          <ThemeToggle />
        </div>
        <div className="register-container">
          <div className="register-header">
            <div className="register-icon">
              <Mic size={40} />
            </div>
            <h1 className="register-title">Create Account</h1>
            <p className="register-subtitle">
              Start your interview prep journey
            </p>
          </div>

          <div className="register-card">
            <form onSubmit={handleSubmit} className="register-form">
              <div className="input-group">
                <label className="input-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  required
                  placeholder="you@example.com"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  required
                  placeholder="••••••••"
                  minLength={6}
                />
                <span className="input-hint">Minimum 6 characters</span>
              </div>

              <div className="consent-panel">
                <div className="consent-checkbox">
                  <input
                    type="checkbox"
                    id="audioConsent"
                    checked={audioConsent}
                    onChange={(e) => setAudioConsent(e.target.checked)}
                  />
                  <label htmlFor="audioConsent" className="consent-label">
                    <strong>Audio Recording Consent:</strong> I consent to audio
                    recording for interview practice. Audio will be retained for
                    30 days and used only for evaluation purposes.
                  </label>
                </div>
              </div>

              {error && (
                <div className="error-panel">
                  <AlertCircle size={20} className="error-icon" />
                  <div className="error-content">
                    <h4>Registration Error</h4>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="register-button"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <div className="register-footer">
              <p className="login-link">
                Already have an account? <Link to="/login">Login</Link>
              </p>
              <p className="register-disclaimer">
                By creating an account, you agree to receive interview session
                updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
