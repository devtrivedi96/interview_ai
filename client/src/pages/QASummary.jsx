import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sessionService } from "../services/sessionService";
import { ArrowLeft, Loader } from "lucide-react";

export default function QASummary() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [qaData, setQaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  useEffect(() => {
    const loadQAHistory = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await sessionService.getQAHistory(sessionId);
        setQaData(data);
      } catch (err) {
        console.error("Failed to load Q&A history:", err);
        setError(
          err?.response?.data?.detail ||
            "Failed to load Q&A history. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      loadQAHistory();
    }
  }, [sessionId]);

  const getScoreColor = (score) => {
    if (score >= 4) return "#10b981"; // green
    if (score >= 3) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingCenter}>
          <Loader size={32} style={{ animation: "spin 1s linear infinite" }} />
          <p style={styles.loadingText}>Loading Q&A Summary...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button
          onClick={() => navigate(-1)}
          style={styles.backButton}
          title="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={styles.title}>Q&A Summary</h1>
        <div style={styles.stats}>
          {qaData && (
            <>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Questions Attempted</span>
                <span style={styles.statValue}>
                  {qaData.qa_items?.length || 0}
                </span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Session Mode</span>
                <span style={styles.statValue}>
                  {(qaData.mode || "N/A").replace(/_/g, " ")}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div style={styles.errorBox}>
          <p style={styles.errorText}>{error}</p>
        </div>
      )}

      {/* Q&A List */}
      {qaData?.qa_items && qaData.qa_items.length > 0 ? (
        <div style={styles.qaList}>
          {qaData.qa_items.map((item, idx) => (
            <div key={idx} style={styles.qaCard}>
              {/* Question Header */}
              <button
                onClick={() =>
                  setExpandedQuestion(expandedQuestion === idx ? null : idx)
                }
                style={styles.questionHeader}
              >
                <div style={styles.questionInfo}>
                  <span style={styles.questionNumber}>Question {idx + 1}</span>
                  <p style={styles.questionText}>{item.question_text}</p>
                </div>
                {item.evaluation && (
                  <div
                    style={{
                      ...styles.scoreTag,
                      backgroundColor: getScoreColor(item.evaluation.score),
                    }}
                  >
                    {Number(item.evaluation.score).toFixed(1)}
                  </div>
                )}
              </button>

              {/* Expanded Content */}
              {expandedQuestion === idx && (
                <div style={styles.expandedContent}>
                  {/* User Answer */}
                  <div style={styles.answerSection}>
                    <h4 style={styles.sectionTitle}>Your Answer</h4>
                    <div style={styles.answerBox}>
                      {item.user_answer ? (
                        <p style={styles.answerText}>{item.user_answer}</p>
                      ) : (
                        <p style={styles.emptyText}>No answer provided</p>
                      )}
                    </div>
                  </div>

                  {/* Expected Answer */}
                  {(item.expected_answer ||
                    (item.evaluation && item.evaluation.expected_answer)) && (
                    <div style={styles.answerSection}>
                      <h4 style={styles.sectionTitle}>Expected Answer</h4>
                      <div style={styles.expectedAnswerBox}>
                        <p style={styles.answerText}>
                          {item.expected_answer ||
                            item.evaluation.expected_answer}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Evaluation */}
                  {item.evaluation && (
                    <div style={styles.evaluationSection}>
                      <div style={styles.evaluationHeader}>
                        <h4 style={styles.sectionTitle}>Evaluation</h4>
                        <div
                          style={{
                            ...styles.scoreDisplay,
                            backgroundColor: getScoreColor(
                              item.evaluation.score,
                            ),
                          }}
                        >
                          Score: {Number(item.evaluation.score).toFixed(1)}/5
                        </div>
                      </div>
                      {item.evaluation.feedback && (
                        <div style={styles.feedbackBox}>
                          <p style={styles.feedbackText}>
                            {item.evaluation.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>
            {error
              ? "Could not load Q&A data"
              : "No Q&A history available for this session"}
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "40px 24px",
    minHeight: "100vh",
    backgroundColor: "var(--bg, #0a0a0f)",
    color: "var(--text-1, #f0f0f5)",
    fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    marginBottom: "40px",
    flexWrap: "wrap",
  },
  backButton: {
    background: "var(--surface, #16161f)",
    border: "1px solid var(--border, #2a2a3d)",
    color: "var(--text-1, #f0f0f5)",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  title: {
    fontSize: "28px",
    fontWeight: "600",
    margin: "0",
    flex: "1",
  },
  stats: {
    display: "flex",
    gap: "24px",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  statLabel: {
    fontSize: "12px",
    color: "var(--text-3, #70707e)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "600",
    color: "var(--accent-2, #3b82f6)",
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid #ef4444",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "24px",
  },
  errorText: {
    color: "#fca5a5",
    margin: "0",
    fontSize: "14px",
  },
  qaList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  qaCard: {
    backgroundColor: "var(--surface, #16161f)",
    border: "1px solid var(--border, #2a2a3d)",
    borderRadius: "12px",
    overflow: "hidden",
  },
  questionHeader: {
    width: "100%",
    padding: "20px",
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    transition: "background-color 0.2s",
  },
  questionInfo: {
    flex: "1",
    textAlign: "left",
  },
  questionNumber: {
    fontSize: "12px",
    color: "var(--text-3, #70707e)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "block",
    marginBottom: "8px",
  },
  questionText: {
    fontSize: "16px",
    fontWeight: "500",
    color: "var(--text-1, #f0f0f5)",
    margin: "0",
    lineHeight: "1.4",
  },
  scoreTag: {
    padding: "8px 12px",
    borderRadius: "6px",
    color: "white",
    fontWeight: "600",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  expandedContent: {
    padding: "0 20px 20px",
    borderTop: "1px solid var(--border, #2a2a3d)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  answerSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-2, #b0b0c0)",
    margin: "0",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  answerBox: {
    backgroundColor: "var(--surface-2, #1e1e2b)",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid var(--border, #2a2a3d)",
  },
  expectedAnswerBox: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid rgba(16, 185, 129, 0.3)",
  },
  answerText: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "var(--text-1, #f0f0f5)",
    margin: "0",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  emptyText: {
    fontSize: "14px",
    color: "var(--text-3, #70707e)",
    margin: "0",
  },
  evaluationSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  evaluationHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  scoreDisplay: {
    padding: "8px 12px",
    borderRadius: "6px",
    color: "white",
    fontWeight: "600",
    fontSize: "13px",
  },
  feedbackBox: {
    backgroundColor: "var(--surface-2, #1e1e2b)",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid var(--border, #2a2a3d)",
  },
  feedbackText: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "var(--text-1, #f0f0f5)",
    margin: "0",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
  },
};
