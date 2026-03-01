import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sessionService } from "../services/sessionService";
import {
  Mic,
  Square,
  Volume2,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Moon,
  Sun,
} from "lucide-react";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  :root {
    --bg:          #0a0a0f;
    --surface:     #16161f;
    --surface-2:   #1e1e2b;
    --surface-3:   #252535;
    --border:      #2a2a3d;
    --text-1:      #f0f0f5;
    --text-2:      #b0b0c0;
    --text-3:      #70707e;
    --accent:      #ff6b35;
    --accent-glow: rgba(255, 107, 53, 0.25);
    --accent-soft: #2a1c16;
    --green:       #10b981;
    --green-glow:  rgba(16, 185, 129, 0.2);
    --green-soft:  #0d2d20;
    --amber:       #f59e0b;
    --amber-glow:  rgba(245, 158, 11, 0.2);
    --amber-soft:  #2d2410;
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
    --surface-3:   #e8e3db;
    --border:      #d8d3cb;
    --text-1:      #1a1714;
    --text-2:      #6b6560;
    --text-3:      #a09890;
    --accent:      #ff6b35;
    --accent-glow: rgba(255, 107, 53, 0.15);
    --accent-soft: #fde8dc;
    --green:       #10b981;
    --green-glow:  rgba(16, 185, 129, 0.15);
    --green-soft:  #d1fae5;
    --amber:       #f59e0b;
    --amber-glow:  rgba(245, 158, 11, 0.15);
    --amber-soft:  #fef3c7;
    --blue:        #3b82f6;
    --blue-soft:   #dbeafe;
    --purple:      #a855f7;
    --purple-glow: rgba(168, 85, 247, 0.15);
    --shadow-sm:   0 1px 3px rgba(26,23,20,.06), 0 1px 2px rgba(26,23,20,.04);
    --shadow-md:   0 4px 16px rgba(26,23,20,.08), 0 2px 6px rgba(26,23,20,.04);
    --shadow-glow: 0 0 20px var(--accent-glow);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    background: var(--bg);
    transition: background 0.3s ease;
  }

  .iv-root {
    max-width: 920px;
    margin: 0 auto;
    padding: 36px 24px 80px;
    font-family: var(--font-body);
    color: var(--text-1);
    position: relative;
  }

  /* Theme toggle */
  .iv-theme-toggle {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--surface);
    border: 2px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-md);
    z-index: 100;
  }
  .iv-theme-toggle:hover {
    transform: rotate(180deg) scale(1.1);
    box-shadow: var(--shadow-md), 0 0 20px var(--accent-glow);
  }
  .iv-theme-toggle svg {
    color: var(--accent);
    transition: transform 0.3s ease;
  }

  /* Loading */
  .iv-loading {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
  }
  .iv-loader-ring {
    width: 64px;
    height: 64px;
    border: 4px solid var(--border);
    border-top-color: var(--accent);
    border-right-color: var(--purple);
    border-radius: 50%;
    animation: spin 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
    box-shadow: 0 0 30px var(--accent-glow);
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px var(--accent-glow); }
    50% { box-shadow: 0 0 40px var(--accent-glow), 0 0 60px var(--purple-glow); }
  }
  .iv-loader-text { 
    font-size: 14px;
    color: var(--text-2);
    font-weight: 600;
    animation: fade-in-up 0.6s ease;
  }
  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Header */
  .iv-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 16px;
    animation: slide-down 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes slide-down {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .iv-q-label {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -.05em;
    color: var(--text-1);
    background: linear-gradient(135deg, var(--text-1) 0%, var(--accent) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .iv-q-label span { 
    color: var(--accent);
    text-shadow: 0 0 20px var(--accent-glow);
  }

  .iv-badges { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .iv-badge {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .1em;
    padding: 6px 14px;
    border-radius: 100px;
    background: var(--surface-2);
    color: var(--text-1);
    border: 2px solid var(--border);
    box-shadow: var(--shadow-sm);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: fade-in 0.6s ease 0.2s backwards;
  }
  .iv-badge:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md), 0 0 20px var(--accent-glow);
  }
  @keyframes fade-in {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
  .iv-replay-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    border: 2px solid var(--border);
    background: var(--surface);
    color: var(--text-2);
    font-family: var(--font-body);
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-sm);
  }
  .iv-replay-btn:hover { 
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md), 0 0 20px var(--accent-glow);
  }
  .iv-replay-btn.speaking { 
    color: #fff;
    background: var(--accent);
    border-color: var(--accent);
    animation: pulse-glow 2s ease infinite;
  }

  /* Question box */
  .iv-question-box {
    background: linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: 40px 44px;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255,255,255,.05);
    animation: scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes scale-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .iv-question-box::before {
    content: '"';
    position: absolute;
    top: -30px;
    left: 16px;
    font-family: var(--font-display);
    font-size: 160px;
    font-weight: 800;
    color: var(--accent);
    opacity: 0.08;
    line-height: 1;
    pointer-events: none;
    user-select: none;
  }
  .iv-question-box::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--accent) 0%, var(--purple) 100%);
    opacity: 0.6;
  }
  .iv-question-text {
    font-size: 1.35rem;
    line-height: 1.75;
    color: var(--text-1);
    font-weight: 500;
    position: relative;
    letter-spacing: -0.01em;
  }

  /* Controls bar */
  .iv-controls-bar {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 18px 24px;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    margin-bottom: 32px;
    flex-wrap: wrap;
    box-shadow: var(--shadow-sm);
    animation: fade-in 0.5s ease 0.3s backwards;
  }
  .iv-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text-2);
    user-select: none;
    transition: color 0.2s ease;
  }
  .iv-toggle:hover {
    color: var(--text-1);
  }
  .iv-toggle input[type=checkbox] { display: none; }
  .iv-toggle-track {
    width: 44px;
    height: 24px;
    background: var(--surface-2);
    border: 2px solid var(--border);
    border-radius: 100px;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .iv-toggle input:checked ~ .iv-toggle-track {
    background: var(--accent);
    border-color: var(--accent);
    box-shadow: 0 0 20px var(--accent-glow);
  }
  .iv-toggle-thumb {
    width: 18px;
    height: 18px;
    background: #fff;
    border-radius: 50%;
    position: absolute;
    top: 1px;
    left: 1px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  .iv-toggle input:checked ~ .iv-toggle-track .iv-toggle-thumb {
    left: 21px;
  }

  /* Record area */
  .iv-record-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 48px 28px;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    margin-bottom: 24px;
    box-shadow: var(--shadow-md);
    position: relative;
    overflow: hidden;
    animation: fade-in 0.6s ease 0.4s backwards;
  }
  .iv-record-area::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  .iv-record-area:hover::before {
    opacity: 1;
  }

  .iv-record-btn {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    z-index: 1;
  }
  .iv-record-btn::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--purple));
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }
  .iv-record-btn:hover::before {
    opacity: 1;
  }
  .iv-record-btn:disabled { 
    opacity: 0.5;
    cursor: not-allowed;
    transform: scale(1);
  }
  .iv-record-btn.idle {
    background: linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%);
    color: #fff;
    box-shadow: 0 8px 32px var(--accent-glow), 0 4px 16px rgba(0,0,0,0.3);
  }
  .iv-record-btn.idle:hover:not(:disabled) {
    transform: scale(1.12);
    box-shadow: 0 12px 48px var(--accent-glow), 0 6px 24px rgba(0,0,0,0.4);
  }
  .iv-record-btn.recording {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: #fff;
    box-shadow: 0 8px 32px rgba(239, 68, 68, 0.4), 0 4px 16px rgba(0,0,0,0.3);
    animation: recordPulse 2s ease-in-out infinite;
  }
  @keyframes recordPulse {
    0%, 100% { 
      box-shadow: 0 8px 32px rgba(239, 68, 68, 0.4), 0 0 0 0 rgba(239, 68, 68, 0.3);
    }
    50% { 
      box-shadow: 0 8px 32px rgba(239, 68, 68, 0.6), 0 0 0 20px rgba(239, 68, 68, 0.05);
    }
  }
  .iv-record-btn.recording:hover { transform: scale(1.08); }

  .iv-record-status {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-2);
    display: flex;
    align-items: center;
    gap: 10px;
    animation: fade-in-up 0.4s ease;
  }
  .iv-record-status.active { color: var(--accent); }
  .rec-dot {
    width: 10px;
    height: 10px;
    background: var(--accent);
    border-radius: 50%;
    animation: blink 1.2s ease-in-out infinite;
    box-shadow: 0 0 10px var(--accent-glow);
  }
  @keyframes blink {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.3; transform: scale(0.9); }
  }

  .iv-evaluating {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-2);
  }

  /* Error */
  .iv-error {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%);
    border: 2px solid rgba(239, 68, 68, 0.3);
    border-radius: var(--radius-sm);
    color: #ef4444;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 24px;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
    animation: shake 0.5s ease;
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    75% { transform: translateX(8px); }
  }

  /* Evaluation card */
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .iv-eval { 
    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .iv-score-hero {
    background: linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: 48px 32px;
    text-align: center;
    margin-bottom: 28px;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }
  .iv-score-hero::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--accent) 0%, var(--purple) 50%, var(--green) 100%);
  }
  .iv-score-label {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--text-3);
    margin-bottom: 16px;
  }
  .iv-score-value {
    font-family: var(--font-display);
    font-size: 5.5rem;
    font-weight: 800;
    letter-spacing: -0.08em;
    background: linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
    animation: score-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s backwards;
  }
  @keyframes score-pop {
    from { transform: scale(0.5); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .iv-score-denom {
    font-size: 2rem;
    color: var(--text-3);
    font-weight: 400;
  }
  .iv-confidence {
    font-size: 13px;
    color: var(--text-3);
    margin-top: 12px;
    font-weight: 600;
  }

  /* Dimensions */
  .iv-dims {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
    margin-bottom: 28px;
  }
  @media (max-width: 600px) {
    .iv-dims {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  .iv-dim {
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 18px 10px;
    text-align: center;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: fade-in 0.5s ease calc(var(--i) * 0.1s) backwards;
  }
  .iv-dim:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md), 0 0 20px var(--accent-glow);
    border-color: var(--accent);
  }
  .iv-dim-score {
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 800;
    letter-spacing: -0.05em;
    background: linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .iv-dim-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-3);
    margin-top: 6px;
  }

  /* Transcript */
  .iv-transcript {
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 20px 24px;
    margin-bottom: 28px;
    box-shadow: var(--shadow-md);
    position: relative;
    overflow: hidden;
    animation: fade-in 0.5s ease 0.3s backwards;
  }
  .iv-transcript::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, var(--accent) 0%, var(--purple) 100%);
  }
  .iv-transcript-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--text-3);
    margin-bottom: 12px;
  }
  .iv-transcript-text {
    font-size: 15px;
    color: var(--text-1);
    line-height: 1.7;
    font-weight: 500;
  }
  .iv-clarity {
    font-size: 13px;
    color: var(--text-3);
    margin-top: 12px;
    font-weight: 600;
  }
  .iv-clarity-warn {
    color: var(--amber);
    font-weight: 700;
  }

  /* Feedback grid */
  .iv-feedback {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 32px;
  }
  @media (max-width: 600px) {
    .iv-feedback {
      grid-template-columns: 1fr;
    }
  }

  .iv-fb-card {
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 24px;
    box-shadow: var(--shadow-md);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: fade-in 0.5s ease calc(var(--i) * 0.1s + 0.4s) backwards;
    position: relative;
    overflow: hidden;
  }
  .iv-fb-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    opacity: 0.8;
  }
  .iv-fb-card:first-child::before {
    background: linear-gradient(90deg, var(--green) 0%, var(--blue) 100%);
  }
  .iv-fb-card:last-child::before {
    background: linear-gradient(90deg, var(--amber) 0%, var(--accent) 100%);
  }
  .iv-fb-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-glow), var(--shadow-md);
  }
  .iv-fb-title {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .iv-fb-title.green { color: var(--green); }
  .iv-fb-title.amber { color: var(--amber); }
  .iv-fb-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    font-size: 14px;
    color: var(--text-2);
    line-height: 1.6;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
    transition: all 0.2s ease;
  }
  .iv-fb-item:hover {
    color: var(--text-1);
    padding-left: 4px;
  }
  .iv-fb-item:last-child { border-bottom: none; }
  .iv-fb-icon {
    flex-shrink: 0;
    margin-top: 3px;
  }
  .iv-fb-icon.green { color: var(--green); }
  .iv-fb-icon.amber { color: var(--amber); }

  /* Actions */
  .iv-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
    animation: fade-in-up 0.5s ease 0.5s backwards;
  }
  .iv-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 16px 32px;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%);
    color: #fff;
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.02em;
    border: none;
    cursor: pointer;
    box-shadow: 0 8px 24px var(--accent-glow), 0 4px 12px rgba(0,0,0,0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }
  .iv-btn-primary::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s ease;
  }
  .iv-btn-primary:hover::before {
    left: 100%;
  }
  .iv-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px var(--accent-glow), 0 6px 16px rgba(0,0,0,0.3);
  }
  .iv-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 16px 32px;
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text-2);
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.02em;
    border: 2px solid var(--border);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-sm);
  }
  .iv-btn-secondary:hover {
    background: var(--surface-2);
    color: var(--text-1);
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .iv-countdown {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: rgba(255,255,255,0.25);
    border-radius: 50%;
    font-size: 14px;
    font-weight: 800;
    animation: countdown-pulse 1s ease infinite;
  }
  @keyframes countdown-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.15); opacity: 0.8; }
  }

  /* Next strategy */
  .iv-strategy {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--text-3);
    margin-top: 12px;
    padding: 8px 12px;
    background: var(--surface-2);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
  }
  .iv-strategy strong {
    color: var(--accent);
    font-weight: 700;
  }
`;

const MAX_QUESTIONS_PER_SESSION = Number(
  import.meta.env.VITE_MAX_QUESTIONS_PER_SESSION ?? 10,
);

const formatScore = (value, digits = 1, fallback = "0.0") => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(digits) : fallback;
};

const deriveDimensionScores = (evaluation) => {
  if (!evaluation) return [];

  if (
    evaluation.dimension_scores &&
    typeof evaluation.dimension_scores === "object"
  ) {
    return Object.entries(evaluation.dimension_scores).map(
      ([key, value], index) => ({
        key,
        label: `D${index + 1}`,
        value: Number(value),
      }),
    );
  }

  const scores = [];
  for (let i = 1; i <= 5; i += 1) {
    const value = evaluation[`score_dimension_${i}`];
    if (value !== undefined && value !== null) {
      scores.push({
        key: `dimension_${i}`,
        label: `D${i}`,
        value: Number(value),
      });
    }
  }
  return scores;
};

export default function Interview() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [autoFlow, setAutoFlow] = useState(true);
  const [handsFree, setHandsFree] = useState(true);
  const [autoNextCountdown, setAutoNextCountdown] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(1);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [summary, setSummary] = useState(null);
  const [isFetchingSummary, setIsFetchingSummary] = useState(false);
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);
  const [hasReachedMax, setHasReachedMax] = useState(false);
  const [theme, setTheme] = useState("dark");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const startTimeRef = useRef(null);
  const utteranceRef = useRef(null);
  const autoNextTimerRef = useRef(null);

  useEffect(() => {
    loadNextQuestion();
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("interview-theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("interview-theme", newTheme);
  };

  const showError = (message) => {
    setError(message);
    if (window?.toast?.error) {
      window.toast.error(message);
    }
  };

  const resetAutoNextTimer = () => {
    if (autoNextTimerRef.current) {
      clearInterval(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setAutoNextCountdown(0);
  };

  const fetchTranscriptFromUrl = async (url) => {
    if (!url) return;
    setIsFetchingTranscript(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Transcript fetch failed");
      const data = await response.json();
      const text =
        data?.transcript ?? data?.text ?? data?.transcript_text ?? "";
      setTranscript(text || "");
    } catch (err) {
      console.error("Transcript fetch error", err);
      showError("Could not load transcript from storage.");
    } finally {
      setIsFetchingTranscript(false);
    }
  };

  const fetchSummary = async () => {
    setIsFetchingSummary(true);
    setSummary(null);
    setError("");
    try {
      const data = await sessionService.getSummary(sessionId);
      setSummary(data);
    } catch (err) {
      console.error(err);
      showError("Unable to load final analysis. Please try again.");
    } finally {
      setIsFetchingSummary(false);
    }
  };

  useEffect(() => {
    if (question?.question_text) speakQuestion(question.question_text);
    return () => {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    };
  }, [question?.id]);

  useEffect(() => {
    if (!evaluation || summary) return;
    if (hasReachedMax) {
      const timer = setTimeout(() => {
        fetchSummary();
      }, 1200);
      return () => clearTimeout(timer);
    }
    if (!autoFlow) return;
    setAutoNextCountdown(4);
    autoNextTimerRef.current = setInterval(() => {
      setAutoNextCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(autoNextTimerRef.current);
          loadNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (autoNextTimerRef.current) clearInterval(autoNextTimerRef.current);
    };
  }, [evaluation, autoFlow, hasReachedMax, summary]);

  const speakQuestion = (text) => {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => setIsSpeakingQuestion(true);
    utterance.onend = () => {
      setIsSpeakingQuestion(false);
      if (handsFree && !evaluation && !isRecording) startRecording();
    };
    utterance.onerror = () => setIsSpeakingQuestion(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const loadNextQuestion = async () => {
    resetAutoNextTimer();
    if (summary) setSummary(null);
    setIsLoadingQuestion(true);
    setError("");
    setEvaluation(null);
    setTranscript("");
    setHasReachedMax(false);
    try {
      const data = await sessionService.getNextQuestion(sessionId);
      setQuestion(data);
      const nextCount =
        typeof data?.questions_count === "number"
          ? data.questions_count
          : questionsCount + 1;
      setQuestionsCount(nextCount);
      setHasReachedMax(nextCount >= MAX_QUESTIONS_PER_SESSION);
      setQuestionIndex(nextCount || 1);
    } catch (err) {
      if (err?.response?.status === 400) {
        setHasReachedMax(true);
        await fetchSummary();
      } else {
        console.error(err);
        showError("Failed to load question. Please try again.");
      }
    } finally {
      setIsLoadingQuestion(false);
      setIsRecording(false);
    }
  };

  const startRecording = async () => {
    const currentQuestionId = question?.id || question?.question_id;
    if (!currentQuestionId) {
      setError("Question is not ready yet. Please wait a moment.");
      return;
    }
    if (summary || isSubmitting || isLoadingQuestion) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const questionIdAtRecordStart = currentQuestionId;
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      startTimeRef.current = Date.now();
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const duration = (Date.now() - startTimeRef.current) / 1000;
        stream.getTracks().forEach((t) => t.stop());
        await submitAnswer(audioBlob, duration, questionIdAtRecordStart);
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      alert("Please allow microphone access to record your answer.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitAnswer = async (audioBlob, duration, questionId) => {
    setIsSubmitting(true);
    setError("");
    try {
      if (!questionId) throw new Error("Question ID missing");
      const audioFile = new File([audioBlob], "answer.webm", {
        type: "audio/webm",
      });
      // Log file size and prevent empty upload
      if (audioFile.size === 0) {
        setError("Audio file is empty. Please record your answer again.");
        alert("Audio file is empty. Please record your answer again.");
        return;
      }
      const result = await sessionService.submitAnswer(sessionId, questionId, {
        audioFile,
        audioDuration: duration,
      });
      setEvaluation(result);
      const returnedCount =
        typeof result?.questions_count === "number"
          ? result.questions_count
          : questionsCount;
      if (returnedCount) {
        setQuestionsCount(returnedCount);
        setHasReachedMax(returnedCount >= MAX_QUESTIONS_PER_SESSION);
      }
      if (result?.transcript) setTranscript(result.transcript);
      else if (result?.transcript_text) setTranscript(result.transcript_text);
      else if (result?.transcript_url || result?.transcript_json_url) {
        fetchTranscriptFromUrl(result.transcript_url || result.transcript_json_url);
      }
    } catch (err) {
      console.error(err);
      showError("Failed to evaluate answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    try {
      await sessionService.completeSession(sessionId);
    } catch (err) {
      console.error(err);
    }
    await fetchSummary();
  };

  const dimensionScores = deriveDimensionScores(evaluation);
  const compositeScore =
    Number(
      evaluation?.composite_score ??
        (dimensionScores.length
          ? dimensionScores.reduce(
              (acc, curr) => acc + (Number(curr.value) || 0),
              0,
            ) / dimensionScores.length
          : 0),
    ) || 0;
  const confidencePct = formatScore(
    (Number(evaluation?.eval_confidence) || 0) * 100,
    0,
    "0",
  );
  const clarityScore =
    typeof evaluation?.clarity_score === "number"
      ? evaluation.clarity_score
      : null;
  const strengths = Array.isArray(evaluation?.strengths)
    ? evaluation.strengths
    : [];
  const improvements = Array.isArray(evaluation?.improvements)
    ? evaluation.improvements
    : [];

  const summaryStrengths = Array.isArray(summary?.strengths)
    ? summary.strengths
    : Array.isArray(summary?.score?.strengths)
      ? summary.score.strengths
      : [];
  const summaryImprovements = Array.isArray(summary?.improvements)
    ? summary.improvements
    : Array.isArray(summary?.score?.improvements)
      ? summary.score.improvements
      : [];
  const summaryTotalScore =
    Number(
      summary?.total_score ??
        summary?.score?.total_score ??
        summary?.score?.composite_score ??
        summary?.score,
    ) || 0;
  const summaryDimensionAverages =
    summary?.dimension_averages ?? summary?.score?.dimension_averages ?? {};
  const trend =
    summary?.trend ||
    (summary?.difficulty_progression
      ? `Difficulty ${summary.difficulty_progression.start} -> ${summary.difficulty_progression.end}`
      : undefined);

  if ((isLoadingQuestion || isFetchingSummary) && !question && !summary)
    return (
      <>
        <style>{STYLE}</style>
        <div className="iv-root">
          <div className="iv-loading">
            <div className="iv-loader-ring" />
            <p className="iv-loader-text">Loading your question…</p>
          </div>
        </div>
      </>
    );

  if (summary) {
    return (
      <>
        <style>{STYLE}</style>
        <div className="iv-root">
          <button
            className="iv-theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
          </button>

          <div className="iv-header">
            <h1 className="iv-q-label">Final Analysis</h1>
            <div className="iv-badges">
              <span className="iv-badge">
                {summary?.questions_count ?? questionsCount} Questions
              </span>
              <span className="iv-badge">Session Complete</span>
            </div>
          </div>

          <div className="iv-score-hero">
            <div className="iv-score-label">Overall Score</div>
            <div className="iv-score-value">
              {formatScore(summaryTotalScore, 2, "0.00")}
              <span className="iv-score-denom">/5</span>
            </div>
            {trend && <div className="iv-confidence">Trend: {trend}</div>}
          </div>

          {summaryDimensionAverages &&
            Object.keys(summaryDimensionAverages).length > 0 && (
              <div className="iv-dims">
                {Object.entries(summaryDimensionAverages).map(
                  ([key, value], i) => (
                    <div key={key} className="iv-dim" style={{ "--i": i }}>
                      <div className="iv-dim-score">
                        {formatScore(value, 2, "0.00")}
                      </div>
                      <div className="iv-dim-label">{key}</div>
                    </div>
                  ),
                )}
              </div>
            )}

          <div className="iv-feedback">
            <div className="iv-fb-card" style={{ "--i": 0 }}>
              <div className="iv-fb-title green">
                <CheckCircle2 size={15} />
                Strengths
              </div>
              {(summaryStrengths.length
                ? summaryStrengths
                : ["Keep practicing consistently."]
              ).map((s, i) => (
                <div key={i} className="iv-fb-item">
                  <span className="iv-fb-icon green">
                    <CheckCircle2 size={13} />
                  </span>
                  {s}
                </div>
              ))}
            </div>
            <div className="iv-fb-card" style={{ "--i": 1 }}>
              <div className="iv-fb-title amber">
                <ArrowRight size={15} />
                Improvements
              </div>
              {(summaryImprovements.length
                ? summaryImprovements
                : ["Review clarity and structure for future sessions."]
              ).map((s, i) => (
                <div key={i} className="iv-fb-item">
                  <span className="iv-fb-icon amber">
                    <ArrowRight size={13} />
                  </span>
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div className="iv-actions">
            <button
              className="iv-btn-primary"
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="iv-root">
        {/* Theme Toggle */}
        <button
          className="iv-theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
        </button>

        {/* Header */}
        {question && (
          <div className="iv-header">
            <h1 className="iv-q-label">
              Question <span>#{questionIndex}</span>
            </h1>
            <div className="iv-badges">
              <span className="iv-badge">
                Difficulty {question.difficulty}/5
              </span>
              <button
                type="button"
                className={`iv-replay-btn${isSpeakingQuestion ? " speaking" : ""}`}
                onClick={() => speakQuestion(question.question_text)}
              >
                <Volume2 size={13} />
                {isSpeakingQuestion ? "Speaking…" : "Replay"}
              </button>
            </div>
          </div>
        )}

        {/* Question Box */}
        {question && (
          <div className="iv-question-box">
            <p className="iv-question-text">{question.question_text}</p>
          </div>
        )}

        {/* Controls toggles */}
        {!evaluation && (
          <div className="iv-controls-bar">
            <label className="iv-toggle">
              <input
                type="checkbox"
                checked={handsFree}
                onChange={(e) => setHandsFree(e.target.checked)}
              />
              <span className="iv-toggle-track">
                <span className="iv-toggle-thumb" />
              </span>
              Hands-free recording
            </label>
            <label className="iv-toggle">
              <input
                type="checkbox"
                checked={autoFlow}
                onChange={(e) => setAutoFlow(e.target.checked)}
              />
              <span className="iv-toggle-track">
                <span className="iv-toggle-thumb" />
              </span>
              Auto-advance
            </label>
          </div>
        )}

        {/* Recording area */}
        {!evaluation && (
          <div className="iv-record-area">
            <button
              type="button"
              className={`iv-record-btn ${isRecording ? "recording" : "idle"}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={
                isSubmitting || isLoadingQuestion || !question || isSpeakingQuestion
              }
            >
              {isRecording ? (
                <Square size={28} color="#fff" />
              ) : (
                <Mic size={28} color="#fff" />
              )}
            </button>

            {isRecording && (
              <div className="iv-record-status active">
                <span className="rec-dot" />
                Recording… speak clearly
              </div>
            )}
            {!isRecording && !isSubmitting && !isLoadingQuestion && (
              <div className="iv-record-status">
                {isSpeakingQuestion
                  ? "Listening to question…"
                  : "Tap to start recording"}
              </div>
            )}
            {isSubmitting && (
              <div className="iv-evaluating">
                <div
                  className="iv-loader-ring"
                  style={{ width: 20, height: 20, borderWidth: 2 }}
                />
                Evaluating your answer…
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="iv-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Evaluation */}
        {evaluation && (
          <div className="iv-eval">
            {/* Score hero */}
            <div className="iv-score-hero">
              <div className="iv-score-label">Your Score</div>
              <div className="iv-score-value">
                {formatScore(compositeScore, 1, "0.0")}
                <span className="iv-score-denom">/5</span>
              </div>
              <div className="iv-confidence">
                Confidence: {confidencePct}%
              </div>
            </div>

            {/* Dimension scores */}
            {dimensionScores.length > 0 && (
              <div className="iv-dims">
                {dimensionScores.map(({ key, label, value }, i) => (
                  <div key={key} className="iv-dim" style={{ "--i": i }}>
                    <div className="iv-dim-score">
                      {formatScore(value, 1, "0.0")}
                    </div>
                    <div className="iv-dim-label">{label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Transcript */}
            {(transcript || isFetchingTranscript) && (
              <div className="iv-transcript">
                <div className="iv-transcript-label">What AI Heard</div>
                <div className="iv-transcript-text">
                  {isFetchingTranscript ? "Loading transcript…" : transcript}
                </div>
                {clarityScore !== null && (
                  <div className="iv-clarity">
                    Clarity:{" "}
                    <strong>{formatScore(clarityScore, 2, "0.00")}</strong>
                    {!evaluation.clarity_ok && (
                      <span className="iv-clarity-warn">
                        {" "}
                        — try speaking slower for better scoring
                      </span>
                    )}
                  </div>
                )}
                {evaluation.next_question_strategy && (
                  <div className="iv-strategy">
                    <Sparkles size={12} />
                    Next strategy:{" "}
                    <strong>{evaluation.next_question_strategy}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Feedback */}
            <div className="iv-feedback">
              <div className="iv-fb-card" style={{ "--i": 0 }}>
                <div className="iv-fb-title green">
                  <CheckCircle2 size={15} />
                  Strengths
                </div>
                {(strengths.length ? strengths : ["Great structure and clarity."]).map((s, i) => (
                  <div key={i} className="iv-fb-item">
                    <span className="iv-fb-icon green">
                      <CheckCircle2 size={13} />
                    </span>
                    {s}
                  </div>
                ))}
              </div>
              <div className="iv-fb-card" style={{ "--i": 1 }}>
                <div className="iv-fb-title amber">
                  <ArrowRight size={15} />
                  Areas to Improve
                </div>
                {(improvements.length
                  ? improvements
                  : ["Add more concrete examples to back your claims."]
                ).map((s, i) => (
                  <div key={i} className="iv-fb-item">
                    <span className="iv-fb-icon amber">
                      <ArrowRight size={13} />
                    </span>
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="iv-actions">
              <button
                className="iv-btn-primary"
                onClick={() =>
                  hasReachedMax ? fetchSummary() : loadNextQuestion()
                }
                disabled={isLoadingQuestion || isSubmitting}
              >
                {hasReachedMax ? (
                  "View Summary"
                ) : autoFlow && autoNextCountdown > 0 ? (
                  <>
                    <span className="iv-countdown">{autoNextCountdown}</span>{" "}
                    Next Question
                  </>
                ) : (
                  <>
                    Next Question <ChevronRight size={15} />
                  </>
                )}
              </button>
              <button className="iv-btn-secondary" onClick={handleComplete}>
                Complete Session
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

