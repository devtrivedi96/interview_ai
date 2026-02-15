'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<'DSA' | 'HR'>('DSA');
  const [difficulty, setDifficulty] = useState(3);

  const startInterview = () => {
    router.push(`/interview?mode=${mode}&difficulty=${difficulty}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Interview Prep Buddy
          </h1>
          <p className="text-xl text-gray-600">
            AI-powered mock interviews to boost your confidence
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold mb-6">Start Your Practice</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Mode
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('DSA')}
                  className={`p-4 rounded-lg border-2 transition ${
                    mode === 'DSA'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">DSA Interview</div>
                  <div className="text-sm text-gray-600">Data Structures & Algorithms</div>
                </button>
                <button
                  onClick={() => setMode('HR')}
                  className={`p-4 rounded-lg border-2 transition ${
                    mode === 'HR'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">HR Interview</div>
                  <div className="text-sm text-gray-600">Behavioral Questions</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Starting Difficulty: {difficulty}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={difficulty}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDifficulty(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Easy</span>
                <span>Medium</span>
                <span>Hard</span>
              </div>
            </div>

            <button
              onClick={startInterview}
              className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Start Interview
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a href="/dashboard" className="text-indigo-600 hover:underline">
            View Your Progress
          </a>
        </div>
      </div>
    </main>
  );
}
