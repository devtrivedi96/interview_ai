import { useState, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { useProfileStore } from "../stores/profileStore";
import PreferencesModal from "../components/PreferencesModal";
import ThemeToggle from "../components/ThemeToggle";
import {
  User,
  Edit2,
  ShieldCheck,
  Mic,
  CalendarDays,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  :root {
    --bg:          #0a0a0f;
    --surface:     #16161f;
    --surface-2:   #1e1e2b;
    --border:      #2a2a3d;
    --text-1:      #f0f0f5;
    --text-2:      #b0b0c0;
    --text-3:      #70707e;
    --accent:      #ff6b35;
    --accent-glow: rgba(255, 107, 53, 0.25);
    --accent-soft: #2a1c16;
    --green:       #10b981;
    --green-glow:  rgba(16, 185, 129, 0.2);
    --blue:        #3b82f6;
    --blue-soft:   #0f1d35;
    --purple:      #a855f7;
    --purple-glow: rgba(168, 85, 247, 0.2);
    --shadow-sm:   0 2px 8px rgba(0,0,0,.3), 0 1px 3px rgba(0,0,0,.2);
    --shadow-md:   0 8px 24px rgba(0,0,0,.4), 0 4px 12px rgba(0,0,0,.3);
    --shadow-glow: 0 0 40px var(--accent-glow);
    --radius:      16px;
    --radius-sm:   10px;
    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;
  }

  [data-theme="light"] {
    --bg:          #f7f5f2;
    --surface:     #ffffff;
    --surface-2:   #f0ede8;
    --border:      #d8d3cb;
    --text-1:      #1a1714;
    --text-2:      #6b6560;
    --text-3:      #a09890;
    --accent:      #ff6b35;
    --accent-glow: rgba(255, 107, 53, 0.15);
    --accent-soft: #fde8dc;
    --green:       #10b981;
    --green-glow:  rgba(16, 185, 129, 0.15);
    --blue:        #3b82f6;
    --blue-soft:   #dbeafe;
    --purple:      #a855f7;
    --purple-glow: rgba(168, 85, 247, 0.15);
    --shadow-sm:   0 1px 3px rgba(26,23,20,.06), 0 1px 2px rgba(26,23,20,.04);
    --shadow-md:   0 4px 16px rgba(26,23,20,.08), 0 2px 6px rgba(26,23,20,.04);
    --shadow-glow: 0 0 20px var(--accent-glow);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .pr-root {
    max-width: 920px;
    margin: 0 auto;
    padding: 36px 24px 80px;
    font-family: var(--font-body);
    color: var(--text-1);
    background: var(--bg);
    min-height: 100vh;
    transition: background 0.3s ease, color 0.3s ease;
  }

  /* Loading */
  .pr-loading {
    min-height: 60vh;
    display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 14px;
  }
  .pr-loader {
    width: 44px; height: 44px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Header */
  .pr-header { 
    margin-bottom: 32px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 20px;
  }
  .pr-title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 4vw, 2.8rem);
    font-weight: 800;
    letter-spacing: -.04em;
    line-height: 1;
  }
  .pr-title span { color: var(--accent); }
  .pr-subtitle { font-size: 14px; color: var(--text-3); margin-top: 7px; font-weight: 300; }

  /* Cards */
  .pr-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 28px 30px;
    box-shadow: var(--shadow-sm);
    margin-bottom: 20px;
    transition: box-shadow .2s;
  }
  .pr-card:hover { box-shadow: var(--shadow-md); }

  /* Section head */
  .pr-section-head {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 22px; flex-wrap: wrap; gap: 12px;
  }
  .pr-section-title {
    font-family: var(--font-display);
    font-size: 1rem; font-weight: 700; letter-spacing: -.02em;
    display: flex; align-items: center; gap: 8px;
  }
  .pr-section-title svg { color: var(--accent); }

  /* User hero */
  .pr-user-hero {
    display: flex; align-items: center; gap: 18px;
    margin-bottom: 24px; padding-bottom: 24px;
    border-bottom: 1px solid var(--border);
  }
  .pr-avatar {
    width: 64px; height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent) 0%, #e8864a 100%);
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    font-family: var(--font-display);
    font-size: 1.5rem; font-weight: 800;
    flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(212,98,42,.3);
  }
  .pr-user-email {
    font-family: var(--font-display);
    font-size: 1.2rem; font-weight: 700; letter-spacing: -.02em;
    color: var(--text-1); word-break: break-all;
  }
  .pr-user-since {
    font-size: 12.5px; color: var(--text-3);
    display: flex; align-items: center; gap: 5px;
    margin-top: 4px; font-weight: 400;
  }

  /* Meta grid */
  .pr-meta-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 16px; margin-bottom: 24px;
  }
  .pr-meta-item {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 14px 16px;
  }
  .pr-meta-label {
    font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .12em;
    color: var(--text-3); margin-bottom: 6px;
  }
  .pr-meta-value {
    font-size: 14px; font-weight: 600; color: var(--text-1);
    display: flex; align-items: center; gap: 6px;
  }
  .pr-meta-value.green { color: var(--green); }
  .pr-meta-value.muted { color: var(--text-3); }

  /* Consent section */
  .pr-consent-panel {
    padding-top: 22px;
    border-top: 1px solid var(--border);
  }
  .pr-consent-label {
    font-size: 13px; font-weight: 600; color: var(--text-1); margin-bottom: 14px;
  }
  .pr-consent-opts {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  }

  /* Radio pill */
  .pr-radio { display: none; }
  .pr-radio-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px;
    border-radius: 100px;
    border: 1.5px solid var(--border);
    background: var(--surface);
    font-size: 13px; font-weight: 600;
    color: var(--text-2);
    cursor: pointer;
    transition: border-color .15s, background .15s, color .15s;
    user-select: none;
  }
  .pr-radio:checked + .pr-radio-pill {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--accent);
  }

  .pr-save-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 18px;
    border-radius: var(--radius-sm);
    background: var(--accent);
    color: #fff;
    font-family: var(--font-display);
    font-size: 13px; font-weight: 700;
    border: none; cursor: pointer;
    box-shadow: 0 4px 12px rgba(212,98,42,.3);
    transition: background .15s, transform .15s;
  }
  .pr-save-btn:hover:not(:disabled) { background: #c2571f; transform: translateY(-1px); }
  .pr-save-btn:disabled { opacity: .5; cursor: not-allowed; }

  .pr-consent-msg {
    margin-top: 10px; font-size: 12.5px; font-weight: 500;
    display: flex; align-items: center; gap: 6px;
  }
  .pr-consent-msg.ok { color: var(--green); }
  .pr-consent-msg.err { color: #dc2626; }

  /* Preferences */
  .pr-pref-section { margin-bottom: 18px; }
  .pr-pref-label {
    font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .12em;
    color: var(--text-3); margin-bottom: 8px;
  }
  .pr-pref-value {
    font-size: 14px; font-weight: 600; color: var(--text-1); text-transform: capitalize;
  }

  /* Tags */
  .pr-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .pr-tag {
    display: inline-block;
    padding: 4px 11px;
    border-radius: 100px;
    font-size: 12px; font-weight: 600;
    border: 1px solid transparent;
  }
  .pr-tag.default { background: var(--surface-2); color: var(--text-2); border-color: var(--border); }
  .pr-tag.blue    { background: var(--blue-soft); color: var(--blue); }
  .pr-tag.green   { background: var(--green-soft); color: var(--green); }
  .pr-tag.purple  { background: var(--purple-soft); color: var(--purple); }
  .pr-tag.accent  { background: var(--accent-soft); color: var(--accent); }

  /* Edit btn */
  .pr-edit-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
    background: var(--surface);
    color: var(--text-2);
    font-family: var(--font-display);
    font-size: 13px; font-weight: 700;
    cursor: pointer;
    transition: background .15s, color .15s, border-color .15s;
  }
  .pr-edit-btn:hover { background: var(--accent-soft); color: var(--accent); border-color: transparent; }

  /* Set preferences CTA */
  .pr-empty {
    text-align: center; padding: 40px 24px;
  }
  .pr-empty-icon {
    width: 52px; height: 52px;
    background: var(--surface-2); border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-3); margin: 0 auto 14px;
  }
  .pr-empty-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--text-2); margin-bottom: 6px; }
  .pr-empty-sub { font-size: 13.5px; color: var(--text-3); margin-bottom: 20px; }
  .pr-cta-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 22px;
    border-radius: var(--radius-sm);
    background: var(--accent);
    color: #fff;
    font-family: var(--font-display);
    font-size: 14px; font-weight: 700;
    border: none; cursor: pointer;
    box-shadow: 0 4px 14px rgba(212,98,42,.3);
    transition: background .15s, transform .15s;
  }
  .pr-cta-btn:hover { background: #c2571f; transform: translateY(-1px); }

  .pr-updated {
    font-size: 11px; color: var(--text-3);
    padding-top: 16px; margin-top: 4px;
    border-top: 1px solid var(--border);
  }

  /* Divider */
  .pr-divider { border: none; border-top: 1px solid var(--border); margin: 18px 0; }

  /* Animations */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .pr-root > * { animation: fadeUp .35s ease both; }
  .pr-root > *:nth-child(1) { animation-delay: .05s }
  .pr-root > *:nth-child(2) { animation-delay: .10s }
  .pr-root > *:nth-child(3) { animation-delay: .15s }
`;

export default function Profile() {
  const { user, updateAudioConsent } = useAuthStore();
  const { preferences, preferencesExists, fetchPreferences } =
    useProfileStore();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consentValue, setConsentValue] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);
  const [consentMessage, setConsentMessage] = useState("");
  const [consentOk, setConsentOk] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);
  useEffect(() => {
    setConsentValue(Boolean(user?.audio_consent));
  }, [user?.audio_consent]);

  const loadPreferences = async () => {
    try {
      await fetchPreferences();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentSave = async () => {
    setSavingConsent(true);
    setConsentMessage("");
    try {
      await updateAudioConsent(consentValue);
      setConsentMessage("Audio consent updated successfully.");
      setConsentOk(true);
    } catch {
      setConsentMessage("Failed to update consent. Please try again.");
      setConsentOk(false);
    } finally {
      setSavingConsent(false);
    }
  };

  const initial = user?.email?.[0]?.toUpperCase() || "U";
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  if (loading)
    return (
      <>
        <style>{STYLE}</style>
        <div className="pr-root">
          <div className="pr-loading">
            <div className="pr-loader" />
            <p
              style={{
                fontSize: 14,
                color: "var(--text-3)",
                fontFamily: "var(--font-body)",
              }}
            >
              Loading profile…
            </p>
          </div>
        </div>
      </>
    );

  return (
    <>
      <style>{STYLE}</style>
      <div className="pr-root">
        {/* Header */}
        <div className="pr-header">
          <div>
            <h1 className="pr-title">
              Profile<span>.</span>
            </h1>
            <p className="pr-subtitle">
              Manage your account and interview preferences
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* User card */}
        <div className="pr-card">
          {/* Avatar + email */}
          <div className="pr-user-hero">
            <div className="pr-avatar">{initial}</div>
            <div>
              <div className="pr-user-email">
                {user?.email || "user@example.com"}
              </div>
              {joinDate && (
                <div className="pr-user-since">
                  <CalendarDays size={12} />
                  Member since {joinDate}
                </div>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="pr-meta-grid">
            <div className="pr-meta-item">
              <div className="pr-meta-label">Account Status</div>
              <div className="pr-meta-value green">
                <CheckCircle2 size={14} />
                Active
              </div>
            </div>
            <div className="pr-meta-item">
              <div className="pr-meta-label">Audio Consent</div>
              <div
                className={`pr-meta-value ${user?.audio_consent ? "green" : "muted"}`}
              >
                {user?.audio_consent ? (
                  <>
                    <CheckCircle2 size={14} /> Granted
                  </>
                ) : (
                  <>
                    <XCircle size={14} /> Not granted
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Consent toggle */}
          <div className="pr-consent-panel">
            <div className="pr-consent-label">
              <Mic
                size={13}
                style={{
                  display: "inline",
                  marginRight: 6,
                  color: "var(--accent)",
                  verticalAlign: "middle",
                }}
              />
              Allow audio recording for interview answers?
            </div>
            <div className="pr-consent-opts">
              <label>
                <input
                  className="pr-radio"
                  type="radio"
                  name="audio-consent"
                  checked={consentValue === true}
                  onChange={() => setConsentValue(true)}
                />
                <span className="pr-radio-pill">
                  <CheckCircle2 size={13} /> Yes
                </span>
              </label>
              <label>
                <input
                  className="pr-radio"
                  type="radio"
                  name="audio-consent"
                  checked={consentValue === false}
                  onChange={() => setConsentValue(false)}
                />
                <span className="pr-radio-pill">
                  <XCircle size={13} /> No
                </span>
              </label>
              <button
                className="pr-save-btn"
                onClick={handleConsentSave}
                disabled={savingConsent}
              >
                <ShieldCheck size={14} />
                {savingConsent ? "Saving…" : "Save Consent"}
              </button>
            </div>
            {consentMessage && (
              <div className={`pr-consent-msg ${consentOk ? "ok" : "err"}`}>
                {consentOk ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                {consentMessage}
              </div>
            )}
          </div>
        </div>

        {/* Preferences card */}
        <div className="pr-card">
          <div className="pr-section-head">
            <span className="pr-section-title">
              <Edit2 size={15} />
              Interview Preferences
            </span>
            {preferencesExists && (
              <button
                className="pr-edit-btn"
                onClick={() => setShowModal(true)}
              >
                <Edit2 size={13} />
                Edit Preferences
              </button>
            )}
          </div>

          {preferencesExists && preferences ? (
            <>
              <div className="pr-pref-section">
                <div className="pr-pref-label">Tech Stack</div>
                <div className="pr-tags">
                  {preferences.tech_stack?.map((t) => (
                    <span key={t} className="pr-tag default">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <hr className="pr-divider" />

              <div className="pr-pref-section">
                <div className="pr-pref-label">Preferred Roles</div>
                <div className="pr-tags">
                  {preferences.preferred_roles?.map((r) => (
                    <span key={r} className="pr-tag blue">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <hr className="pr-divider" />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 18,
                }}
              >
                <div className="pr-pref-section" style={{ marginBottom: 0 }}>
                  <div className="pr-pref-label">Experience Level</div>
                  <div className="pr-pref-value">
                    {preferences.experience_level || "—"}
                  </div>
                </div>
                <div className="pr-pref-section" style={{ marginBottom: 0 }}>
                  <div className="pr-pref-label">Target Company</div>
                  <div className="pr-pref-value">
                    {preferences.target_company_type?.replace("_", " ") || "—"}
                  </div>
                </div>
              </div>

              <hr className="pr-divider" />

              <div className="pr-pref-section">
                <div className="pr-pref-label">Preferred Interview Modes</div>
                <div className="pr-tags">
                  {preferences.preferred_interview_modes?.map((m) => (
                    <span key={m} className="pr-tag accent">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {preferences.updated_at && (
                <div className="pr-updated">
                  Last updated:{" "}
                  {new Date(preferences.updated_at).toLocaleDateString()}
                </div>
              )}
            </>
          ) : (
            <div className="pr-empty">
              <div className="pr-empty-icon">
                <User size={22} />
              </div>
              <div className="pr-empty-title">No preferences set yet</div>
              <div className="pr-empty-sub">
                Tell us your goals so we can tailor your interview experience.
              </div>
              <button className="pr-cta-btn" onClick={() => setShowModal(true)}>
                <Edit2 size={14} />
                Set Preferences Now
              </button>
            </div>
          )}
        </div>
      </div>

      <PreferencesModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialData={preferences}
      />
    </>
  );
}
